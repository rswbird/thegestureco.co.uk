import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle browser CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      throw new Error(
        "Supabase environment variables are not configured."
      );
    }

    // Client using the caller's JWT.
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization:
              req.headers.get("Authorization") || "",
          },
        },
      }
    );

    // Admin client. The service role key NEVER goes to the browser.
    const adminSupabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // Identify the logged-in user.
    const {
      data: {
        user,
      },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "You must be signed in to invite an employee.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const companyId = String(body.company_id || "").trim();

    if (!email || !companyId) {
      return new Response(
        JSON.stringify({
          error: "Employee email and company are required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Basic email validation.
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Please enter a valid email address.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verify that the caller is an admin of the requested company.
    //
    // This check is performed using the service-role client so
    // the RLS policies cannot create a recursive dependency.
    const {
      data: membership,
      error: membershipError,
    } = await adminSupabase
      .from("company_members")
      .select("id, company_id, user_id, role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Admin membership lookup failed:",
        membershipError
      );

      throw new Error(
        "Unable to verify company administrator access."
      );
    }

    if (!membership) {
      return new Response(
        JSON.stringify({
          error:
            "You do not have permission to invite employees to this company.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check whether the email already belongs to a user.
    const {
      data: existingUsers,
      error: usersError,
    } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) {
      console.error(
        "User lookup failed:",
        usersError
      );

      throw new Error(
        "Unable to check whether this employee already has an account."
      );
    }

    const existingUser = existingUsers.users.find(
      (existing) =>
        existing.email?.toLowerCase() === email
    );

    let invitedUserId: string;

    if (existingUser) {
      invitedUserId = existingUser.id;

      // Check whether the user is already a member
      // of this company.
      const {
        data: existingMembership,
        error: existingMembershipError,
      } = await adminSupabase
        .from("company_members")
        .select("id, role")
        .eq("company_id", companyId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMembershipError) {
        throw new Error(
          "Unable to check the employee's company membership."
        );
      }

      if (existingMembership) {
        return new Response(
          JSON.stringify({
            error:
              "This person is already a member of your company.",
          }),
          {
            status: 409,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Existing account: add them directly to the company.
      const {
        error: insertMembershipError,
      } = await adminSupabase
        .from("company_members")
        .insert({
          company_id: companyId,
          user_id: existingUser.id,
          role: "buyer",
        });

      if (insertMembershipError) {
        console.error(
          "Membership creation failed:",
          insertMembershipError
        );

        throw new Error(
          "The employee account exists, but we could not add them to the company."
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "The employee has been added to your company.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // New user: send a Supabase invitation email.
    const {
      data: inviteData,
      error: inviteError,
    } =
      await adminSupabase.auth.admin.inviteUserByEmail(
        email
      );

    if (inviteError || !inviteData.user) {
      console.error(
        "Supabase invitation failed:",
        inviteError
      );

      throw new Error(
        inviteError?.message ||
          "Unable to send the employee invitation."
      );
    }

    invitedUserId = inviteData.user.id;

    // Create the company membership.
    const {
      error: membershipInsertError,
    } = await adminSupabase
      .from("company_members")
      .insert({
        company_id: companyId,
        user_id: invitedUserId,
        role: "buyer",
      });

    if (membershipInsertError) {
      console.error(
        "Company membership creation failed:",
        membershipInsertError
      );

      // Clean up the newly-created user if membership creation fails.
      await adminSupabase.auth.admin.deleteUser(
        invitedUserId
      );

      throw new Error(
        "The invitation was created, but we could not connect the employee to your company."
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Invitation sent successfully.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "invite-company-member error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "We couldn't send the invitation yet. Please try again later.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
