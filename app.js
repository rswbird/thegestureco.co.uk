import { supabase } from "./supabase.js";

/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;
let currentCompany = null;
let currentMembership = null;
let authMode = "login";


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const modal = $("modal");
const portal = $("portal");


function showMessage(element, message, type = "") {
  if (!element) return;

  element.textContent = message;
  element.className = "auth-message";

  if (type) {
    element.classList.add(type);
  }
}


function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   MODAL
========================================================= */

function openModal() {
  if (!modal) return;

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}


function closeModal() {
  if (!modal) return;

  modal.classList.remove("show");
  document.body.style.overflow = "";
}


/* Close buttons */

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});


const closeModalButton = $("closeModal");

if (closeModalButton) {
  closeModalButton.addEventListener("click", closeModal);
}


if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}


/* =========================================================
   ENQUIRY BUTTONS
========================================================= */

function openEnquiry() {
  openModal();
}


[
  "navEnquire",
  "heroQuote",
  "corporateEnquire",
  "bespokeEnquire",
  "ctaContact",
  "personalGift"
].forEach((id) => {

  const button = $(id);

  if (button) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openEnquiry();
    });
  }

});


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

const menuButton = $("menuButton");
const mobileMenu = $("mobileMenu");


if (menuButton && mobileMenu) {

  menuButton.addEventListener("click", () => {

    const isOpen =
      mobileMenu.classList.toggle("show");

    menuButton.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );

  });

}


document
  .querySelectorAll("#mobileMenu a")
  .forEach((link) => {

    link.addEventListener("click", () => {

      if (mobileMenu) {
        mobileMenu.classList.remove("show");
      }

      if (menuButton) {
        menuButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }

    });

  });


/* =========================================================
   PORTAL
========================================================= */

function openPortal() {

  if (!portal) {
    console.error(
      "[Portal] #portal was not found."
    );
    return;
  }

  portal.classList.add("show");

  document.body.style.overflow = "hidden";

  checkCurrentUser();
}


function closePortal() {

  if (!portal) return;

  portal.classList.remove("show");

  document.body.style.overflow = "";

}


/* MY ACCOUNT */

const accountButton = $("accountButton");

if (accountButton) {

  accountButton.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      openPortal();

    }
  );

}


/* Close portal */

const portalCloseButton =
  $("portalClose");

if (portalCloseButton) {

  portalCloseButton.addEventListener(
    "click",
    closePortal
  );

}


if (portal) {

  portal.addEventListener(
    "click",
    (event) => {

      if (event.target === portal) {
        closePortal();
      }

    }
  );

}


/* =========================================================
   PORTAL PANELS
========================================================= */

function showPanel(id) {

  document
    .querySelectorAll(".portal-panel")
    .forEach((panel) => {

      panel.classList.remove("active");

    });


  const panel = $(id);

  if (panel) {
    panel.classList.add("active");
  }

}


/* =========================================================
   AUTH MODE
========================================================= */

function setAuthMode(mode) {

  authMode = mode;


  const authNameField =
    $("signupNameField");

  const authSubmit =
    $("authSubmit");

  const authTitle =
    $("authTitle");

  const authSubtitle =
    $("authSubtitle");

  const toggleAuth =
    $("toggleAuth");


  if (authNameField) {

    authNameField.classList.toggle(
      "hidden",
      mode !== "signup"
    );

  }


  if (authSubmit) {

    authSubmit.textContent =
      mode === "login"
        ? "SIGN IN"
        : "CREATE ACCOUNT";

  }


  if (authTitle) {

    authTitle.textContent =
      mode === "login"
        ? "Welcome back."
        : "Create your account.";

  }


  if (authSubtitle) {

    authSubtitle.textContent =
      mode === "login"
        ? "Sign in to manage your company, orders and documents."
        : "Create your account to access the customer portal.";

  }


  if (toggleAuth) {

    toggleAuth.textContent =
      mode === "login"
        ? "Need an account? Create one"
        : "Already have an account? Sign in";

  }


  const message =
    $("authMessage");

  if (message) {

    message.textContent = "";

    message.className =
      "auth-message";

  }

}


/* =========================================================
   AUTH TOGGLE
========================================================= */

const toggleAuth =
  $("toggleAuth");

if (toggleAuth) {

  toggleAuth.addEventListener(
    "click",
    () => {

      setAuthMode(
        authMode === "login"
          ? "signup"
          : "login"
      );

    }
  );

}


/* =========================================================
   AUTH FORM
========================================================= */

const authForm =
  $("authForm");


if (authForm) {

  authForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        $("authEmail")?.value
          .trim()
          .toLowerCase();


      const password =
        $("authPassword")?.value;


      const fullName =
        $("signupName")?.value.trim();


      const message =
        $("authMessage");


      const submitButton =
        $("authSubmit");


      if (!email || !password) {

        showMessage(
          message,
          "Please enter your email address and password.",
          "error"
        );

        return;
      }


      if (
        authMode === "signup" &&
        !fullName
      ) {

        showMessage(
          message,
          "Please enter your full name.",
          "error"
        );

        return;
      }


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          authMode === "login"
            ? "SIGNING IN..."
            : "CREATING ACCOUNT...";

      }


      try {

        if (authMode === "login") {

          const {
            data,
            error
          } =
            await supabase.auth.signInWithPassword({
              email,
              password
            });


          if (error) {
            throw error;
          }


          currentUser =
            data.user;


          showMessage(
            message,
            "Login successful.",
            "success"
          );


          await loadUser();


        } else {

          const {
            data,
            error
          } =
            await supabase.auth.signUp({

              email,

              password,

              options: {

                data: {
                  full_name: fullName
                }

              }

            });


          if (error) {
            throw error;
          }


          if (data.user) {
            currentUser = data.user;
          }


          if (data.session) {

            showMessage(
              message,
              "Account created successfully.",
              "success"
            );


            await loadUser();

          } else {

            showMessage(
              message,
              "Account created. Please check your email if confirmation is required.",
              "success"
            );

          }

        }


      } catch (error) {

        console.error(
          "Authentication error:",
          error
        );


        showMessage(
          message,
          error.message ||
            "Something went wrong. Please try again.",
          "error"
        );


      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            authMode === "login"
              ? "SIGN IN"
              : "CREATE ACCOUNT";

        }

      }

    }
  );

}


/* =========================================================
   INVITATION DETECTION
========================================================= */

function isInvitationLink() {

  const searchParams =
    new URLSearchParams(
      window.location.search
    );


  const hashParams =
    new URLSearchParams(
      window.location.hash.replace(/^#/, "")
    );


  return (
    searchParams.get("type") === "invite" ||
    hashParams.get("type") === "invite"
  );

}


/* =========================================================
   INVITATION FLOW
========================================================= */

async function handleInvitationFlow() {

  try {

    const searchParams =
      new URLSearchParams(
        window.location.search
      );


    const tokenHash =
      searchParams.get("token_hash");


    if (tokenHash) {

      const {
        data,
        error
      } =
        await supabase.auth.verifyOtp({

          token_hash:
            tokenHash,

          type:
            "invite"

        });


      if (error) {

        console.error(
          "Invitation verification error:",
          error
        );


        showPanel("authPanel");


        showMessage(
          $("authMessage"),
          "This invitation link is invalid or has expired. Please ask your company administrator to send a new invitation.",
          "error"
        );


        return true;

      }


      if (data?.user) {
        currentUser = data.user;
      }

    }


    const {
      data: sessionData
    } =
      await supabase.auth.getSession();


    const invitedUser =
      sessionData?.session?.user ||
      currentUser;


    if (!invitedUser) {

      showPanel("authPanel");


      showMessage(
        $("authMessage"),
        "Please use the invitation link from your email again.",
        "error"
      );


      return true;

    }


    currentUser =
      invitedUser;


    if (portal) {

      portal.classList.add("show");

      document.body.style.overflow =
        "hidden";

    }


    showPanel(
      "invitePasswordPanel"
    );


    const emailField =
      $("invitePasswordEmail");


    if (emailField) {

      emailField.value =
        invitedUser.email || "";

    }


    return true;


  } catch (error) {

    console.error(
      "Invitation flow error:",
      error
    );


    showPanel("authPanel");


    showMessage(
      $("authMessage"),
      "We could not process your invitation. Please try the invitation link again.",
      "error"
    );


    return true;

  }

}


/* =========================================================
   INVITATION PASSWORD FORM
========================================================= */

const invitePasswordForm =
  $("invitePasswordForm");


if (invitePasswordForm) {

  invitePasswordForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const password =
        $("inviteNewPassword")?.value;


      const confirmPassword =
        $("inviteConfirmPassword")?.value;


      const message =
        $("invitePasswordMessage");


      const submitButton =
        $("invitePasswordSubmit");


      if (
        !password ||
        !confirmPassword
      ) {

        showMessage(
          message,
          "Please enter and confirm your password.",
          "error"
        );

        return;
      }


      if (password.length < 6) {

        showMessage(
          message,
          "Your password must be at least 6 characters.",
          "error"
        );

        return;
      }


      if (
        password !== confirmPassword
      ) {

        showMessage(
          message,
          "The passwords do not match.",
          "error"
        );

        return;
      }


      if (!currentUser) {

        const {
          data: sessionData
        } =
          await supabase.auth.getSession();


        currentUser =
          sessionData?.session?.user ||
          null;

      }


      if (!currentUser) {

        showMessage(
          message,
          "Your invitation session could not be found. Please open the invitation email again.",
          "error"
        );

        return;
      }


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          "CREATING ACCOUNT...";

      }


      try {

        const {
          data,
          error
        } =
          await supabase.auth.updateUser({
            password
          });


        if (error) {
          throw error;
        }


        currentUser =
          data?.user ||
          currentUser;


        showMessage(
          message,
          "Your password has been created successfully. Loading your company account...",
          "success"
        );


        await new Promise(
          (resolve) =>
            setTimeout(resolve, 700)
        );


        await loadUser();


      } catch (error) {

        console.error(
          "Password creation error:",
          error
        );


        showMessage(
          message,
          error.message ||
            "We could not create your password. Please try again.",
          "error"
        );


      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            "CREATE MY ACCOUNT";

        }

      }

    }
  );

}


/* =========================================================
   CHECK CURRENT USER
========================================================= */

async function checkCurrentUser() {

  try {

    if (isInvitationLink()) {

      const handled =
        await handleInvitationFlow();


      if (handled) {
        return;
      }

    }


    const {
      data,
      error
    } =
      await supabase.auth.getSession();


    if (error) {
      throw error;
    }


    if (data.session?.user) {

      currentUser =
        data.session.user;


      await loadUser();

    } else {

      setAuthMode("login");

      showPanel("authPanel");

    }


  } catch (error) {

    console.error(
      "Session error:",
      error
    );


    setAuthMode("login");

    showPanel("authPanel");

  }

}


/* =========================================================
   LOAD USER
========================================================= */

async function loadUser() {

  if (!currentUser) {

    showPanel("authPanel");

    return;

  }


  try {

    const {
      data: profile,
      error: profileError
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();


    if (profileError) {

      console.error(
        "Profile loading error:",
        profileError
      );

    }


    currentProfile =
      profile || null;


    if (
      currentProfile?.is_admin === true
    ) {

      await loadAdminPortal();

      showPanel("adminPanel");

      return;

    }


    await loadCustomerPortal();

    showPanel("customerPanel");


  } catch (error) {

    console.error(
      "Load user error:",
      error
    );


    showPanel("authPanel");


    showMessage(
      $("authMessage"),
      "We could not load your account. Please try again.",
      "error"
    );

  }

}


/* =========================================================
   LOAD CUSTOMER PORTAL
========================================================= */

async function loadCustomerPortal() {

  if (!currentUser) return;


  try {

    const {
      data: membership,
      error: membershipError
    } =
      await supabase
        .from("company_members")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .maybeSingle();


    if (membershipError) {

      console.error(
        "Membership loading error:",
        membershipError
      );

    }


    currentMembership =
      membership || null;


    if (currentMembership?.company_id) {

      const {
        data: company,
        error: companyError
      } =
        await supabase
          .from("companies")
          .select("*")
          .eq(
            "id",
            currentMembership.company_id
          )
          .maybeSingle();


      if (companyError) {

        console.error(
          "Company loading error:",
          companyError
        );

      }


      currentCompany =
        company || null;

    } else {

      currentCompany =
        null;

    }


    populateCustomerDetails();

    await loadCustomerOrders();

    await loadCompanyTeam();

  } catch (error) {

    console.error(
      "Customer portal error:",
      error
    );

  }

}


/* =========================================================
   CUSTOMER DETAILS
========================================================= */

function populateCustomerDetails() {

  const userName =
    currentProfile?.full_name ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.email ||
    "Customer";


  const userEmail =
    currentUser?.email || "";


  const companyName =
    currentCompany?.name ||
    "No company linked";


  const welcome =
    $("customerWelcome");


  if (welcome) {

    welcome.textContent =
      `Welcome, ${userName}`;

  }


  const companyDetails =
    $("companyDetails");


  if (companyDetails) {

    companyDetails.innerHTML = `

      <div>
        <strong>
          ${escapeHtml(companyName)}
        </strong>
      </div>

      <div>
        ${escapeHtml(userEmail)}
      </div>

    `;

  }

}


/* =========================================================
   CUSTOMER ORDERS
========================================================= */

async function loadCustomerOrders() {

  const ordersBody =
    $("ordersBody");


  if (!ordersBody) return;


  if (!currentCompany?.id) {

    ordersBody.innerHTML = `

      <tr>

        <td colspan="5">
          No company account is linked to your account yet.
        </td>

      </tr>

    `;

    updateCustomerStats([]);

    return;

  }


  try {

    const {
      data: orders,
      error
    } =
      await supabase
        .from("orders")
        .select("*")
        .eq(
          "company_id",
          currentCompany.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    updateCustomerStats(
      orders || []
    );


    if (
      !orders ||
      orders.length === 0
    ) {

      ordersBody.innerHTML = `

        <tr>

          <td colspan="5">
            You don't have any orders yet.
          </td>

        </tr>

      `;

      return;

    }


    ordersBody.innerHTML =
      orders.map((order) => {

        const orderNumber =
          order.order_number ||
          order.id?.slice(0, 8) ||
          "";


        const status =
          order.status ||
          "Processing";


        const total =
          Number(
            order.total || 0
          ).toFixed(2);


        const date =
          order.created_at
            ? new Date(
                order.created_at
              ).toLocaleDateString(
                "en-GB"
              )
            : "";


        const delivery =
          order.tracking_status ||
          status;


        return `

          <tr>

            <td>
              <strong>
                #${escapeHtml(
                  orderNumber
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(status)}
            </td>

            <td>
              £${total}
            </td>

            <td>
              ${escapeHtml(delivery)}
            </td>

            <td>
              ${
                order.invoice_url
                  ? `
                    <a
                      href="${escapeHtml(
                        order.invoice_url
                      )}"
                      target="_blank"
                      rel="noopener">
                      DOWNLOAD
                    </a>
                  `
                  : "—"
              }
            </td>

          </tr>

        `;

      }).join("");


  } catch (error) {

    console.error(
      "Customer orders error:",
      error
    );


    ordersBody.innerHTML = `

      <tr>

        <td colspan="5">
          Unable to load your orders right now.
        </td>

      </tr>

    `;

  }

}


/* =========================================================
   CUSTOMER DASHBOARD STATS
========================================================= */

function updateCustomerStats(orders) {

  const totalOrders =
    $("totalOrders");


  const activeOrders =
    $("activeOrders");


  if (totalOrders) {

    totalOrders.textContent =
      orders.length;

  }


  if (activeOrders) {

    const active =
      orders.filter((order) => {

        const status =
          String(
            order.status || ""
          ).toLowerCase();


        return ![
          "completed",
          "delivered",
          "cancelled"
        ].includes(status);

      }).length;


    activeOrders.textContent =
      active;

  }

}


/* =========================================================
   COMPANY TEAM
========================================================= */

async function loadCompanyTeam() {

  const teamList =
    $("teamList");


  if (!teamList) return;


  if (!currentCompany?.id) {

    teamList.innerHTML = `

      <div class="empty-state">
        No employees have been added yet.
      </div>

    `;

    updateTeamCount(0);

    return;

  }


  try {

    const {
      data: members,
      error
    } =
      await supabase
        .from("company_members")
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles (
            full_name,
            email
          )
        `)
        .eq(
          "company_id",
          currentCompany.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    updateTeamCount(
      members?.length || 0
    );


    if (
      !members ||
      members.length === 0
    ) {

      teamList.innerHTML = `

        <div class="empty-state">
          No employees have been added yet.
        </div>

      `;

      return;

    }


    teamList.innerHTML =
      members.map((member) => {

        const profile =
          member.profiles || {};


        const name =
          profile.full_name ||
          profile.email ||
          "Team member";


        const email =
          profile.email ||
          "";


        return `

          <div class="team-member">

            <div class="team-member-info">

              <strong>
                ${escapeHtml(name)}
              </strong>

              <span>
                ${escapeHtml(email)}
              </span>

            </div>


            <div class="team-member-role">

              ${escapeHtml(
                member.role || "buyer"
              )}

            </div>

          </div>

        `;

      }).join("");


  } catch (error) {

    console.error(
      "Company team error:",
      error
    );


    teamList.innerHTML = `

      <div class="empty-state">
        Unable to load company team.
      </div>

    `;

  }

}


/* =========================================================
   TEAM COUNT
========================================================= */

function updateTeamCount(count) {

  const teamUsers =
    $("teamUsers");


  if (teamUsers) {

    teamUsers.textContent =
      count;

  }

}


/* =========================================================
   INVITE EMPLOYEE
========================================================= */

const inviteButton =
  $("inviteButton");


if (inviteButton) {

  inviteButton.addEventListener(
    "click",
    async (event) => {

      event.preventDefault();


      const email =
        $("inviteEmail")?.value
          .trim()
          .toLowerCase();


      const message =
        $("inviteMessage");


      if (!email) {

        if (message) {

          message.textContent =
            "Please enter an employee email address.";

          message.className =
            "auth-message error";

        }

        return;

      }


      if (!currentCompany?.id) {

        if (message) {

          message.textContent =
            "Your account is not linked to a company.";

          message.className =
            "auth-message error";

        }

        return;

      }


      try {

        inviteButton.disabled =
          true;


        inviteButton.textContent =
          "SENDING...";


        const {
          data: sessionData
        } =
          await supabase.auth.getSession();


        const accessToken =
          sessionData?.session?.access_token;


        if (!accessToken) {

          throw new Error(
            "You must be signed in to invite an employee."
          );

        }


        const {
          data: userData,
          error: userError
        } =
          await supabase.auth.getUser();


        if (userError) {
          throw userError;
        }


        if (!userData?.user) {

          throw new Error(
            "You must be signed in to invite an employee."
          );

        }


        const {
          data,
          error
        } =
          await supabase.functions.invoke(
            "invite-company-member",
            {

              body: {

                email,

                company_id:
                  currentCompany.id

              },

              headers: {

                Authorization:
                  `Bearer ${accessToken}`

              }

            }
          );


        if (error) {
          throw error;
        }


        if (
          data &&
          data.error
        ) {

          throw new Error(
            data.error
          );

        }


        if (message) {

          message.textContent =
            "Invitation sent successfully. The employee will receive an email with a link to create their password.";

          message.className =
            "auth-message success";

        }


        const emailInput =
          $("inviteEmail");


        if (emailInput) {
          emailInput.value = "";
        }


        await loadCompanyTeam();


      } catch (error) {

        console.error(
          "Employee invitation error:",
          error
        );


        if (message) {

          message.textContent =
            error.message ||
            "Unable to send the invitation.";

          message.className =
            "auth-message error";

        }


      } finally {

        inviteButton.disabled =
          false;


        inviteButton.textContent =
          "INVITE EMPLOYEE";

      }

    }
  );

}


/* =========================================================
   CUSTOMER LOGOUT
========================================================= */

const customerLogout =
  $("customerLogout");


if (customerLogout) {

  customerLogout.addEventListener(
    "click",
    logout
  );

}


/* =========================================================
   ADMIN PORTAL
========================================================= */

async function loadAdminPortal() {

  populateAdminDetails();

  await loadAdminProducts();

  await loadAdminOrders();

  await loadAdminCompanies();

}


/* =========================================================
   ADMIN DETAILS
========================================================= */

function populateAdminDetails() {

  const adminName =
    $("adminName");


  const adminDashboardName =
    $("adminDashboardName");


  const adminEmail =
    $("adminEmail");


  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "Admin";


  const email =
    currentUser?.email ||
    "";


  if (adminName) {
    adminName.textContent =
      name;
  }


  if (adminDashboardName) {
    adminDashboardName.textContent =
      name;
  }


  if (adminEmail) {
    adminEmail.textContent =
      email;
  }

}


/* =========================================================
   ADMIN PRODUCTS
========================================================= */

async function loadAdminProducts() {

  const container =
    $("adminProducts");


  if (!container) return;


  try {

    const {
      data: products,
      error
    } =
      await supabase
        .from("products")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !products ||
      products.length === 0
    ) {

      container.innerHTML = `

        <div class="empty-state">
          No products have been added yet.
        </div>

      `;

      return;

    }


    container.innerHTML =
      products.map((product) => `

        <div class="admin-product">

          <div>

            <strong>
              ${escapeHtml(
                product.name ||
                "Product"
              )}
            </strong>

            <span>
              ${escapeHtml(
                product.category ||
                ""
              )}
            </span>

          </div>


          <div>

            £${Number(
              product.price || 0
            ).toFixed(2)}

          </div>

        </div>

      `).join("");


  } catch (error) {

    console.error(
      "Admin products error:",
      error
    );


    container.innerHTML = `

      <div class="empty-state">
        Unable to load products.
      </div>

    `;

  }

}


/* =========================================================
   ADMIN ORDERS
========================================================= */

async function loadAdminOrders() {

  const ordersBody =
    $("adminOrdersBody");


  if (!ordersBody) return;


  try {

    const {
      data: orders,
      error
    } =
      await supabase
        .from("orders")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !orders ||
      orders.length === 0
    ) {

      ordersBody.innerHTML = `

        <tr>

          <td colspan="5">
            No orders have been placed yet.
          </td>

        </tr>

      `;

      return;

    }


    ordersBody.innerHTML =
      orders.map((order) => {

        const orderNumber =
          order.order_number ||
          order.id?.slice(0, 8) ||
          "";


        const status =
          order.status ||
          "Processing";


        const total =
          Number(
            order.total || 0
          ).toFixed(2);


        const date =
          order.created_at
            ? new Date(
                order.created_at
              ).toLocaleDateString(
                "en-GB"
              )
            : "";


        return `

          <tr>

            <td>
              #${escapeHtml(
                orderNumber
              )}
            </td>

            <td>
              ${escapeHtml(
                order.company_name ||
                order.company_id ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(status)}
            </td>

            <td>
              £${total}
            </td>

            <td>
              ${escapeHtml(date)}
            </td>

          </tr>

        `;

      }).join("");


  } catch (error) {

    console.error(
      "Admin orders error:",
      error
    );


    ordersBody.innerHTML = `

      <tr>

        <td colspan="5">
          Unable to load orders.
        </td>

      </tr>

    `;

  }

}


/* =========================================================
   ADMIN COMPANIES
========================================================= */

async function loadAdminCompanies() {

  const container =
    $("adminCompanies");


  if (!container) return;


  try {

    const {
      data: companies,
      error
    } =
      await supabase
        .from("companies")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !companies ||
      companies.length === 0
    ) {

      container.innerHTML = `

        <div class="empty-state">
          No companies have been added yet.
        </div>

      `;

      return;

    }


    container.innerHTML =
      companies.map((company) => `

        <div class="admin-company">

          <div>

            <strong>
              ${escapeHtml(
                company.name ||
                "Company"
              )}
            </strong>

            <span>
              ${escapeHtml(
                company.email ||
                ""
              )}
            </span>

          </div>

        </div>

      `).join("");


  } catch (error) {

    console.error(
      "Admin companies error:",
      error
    );


    container.innerHTML = `

      <div class="empty-state">
        Unable to load companies.
      </div>

    `;

  }

}


/* =========================================================
   ADMIN LOGOUT
========================================================= */

const adminLogout =
  $("adminLogout");


if (adminLogout) {

  adminLogout.addEventListener(
    "click",
    logout
  );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    const {
      error
    } =
      await supabase.auth.signOut();


    if (error) {

      console.error(
        "Logout error:",
        error
      );

    }


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );


  } finally {

    currentUser = null;

    currentProfile = null;

    currentCompany = null;

    currentMembership = null;


    authMode = "login";


    setAuthMode("login");


    showPanel("authPanel");

  }

}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

supabase.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "[Auth]",
      event
    );


    currentUser =
      session?.user || null;


    if (
      event === "SIGNED_OUT"
    ) {

      currentProfile = null;

      currentCompany = null;

      currentMembership = null;

      setAuthMode("login");

      showPanel("authPanel");

    }

  }
);


/* =========================================================
   ENQUIRY FORM
========================================================= */

const enquiryForm =
  $("enquiryForm");


if (enquiryForm) {

  enquiryForm.addEventListener(
    "submit",
    async (event) => {

      /*
        This currently allows the existing form
        handling / Netlify handling to continue.
      */

      const submitButton =
        $("enquirySubmit");


      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "SENDING...";

      }

    }
  );

}


/* =========================================================
   HEADER SCROLL EFFECT
========================================================= */

const header =
  document.querySelector(
    ".nav"
  );


function updateHeader() {

  if (!header) return;


  if (window.scrollY > 30) {

    header.classList.add(
      "scrolled"
    );

  } else {

    header.classList.remove(
      "scrolled"
    );

  }

}


window.addEventListener(
  "scroll",
  updateHeader,
  {
    passive: true
  }
);


updateHeader();


/* =========================================================
   SMOOTH SCROLL
========================================================= */

document
  .querySelectorAll(
    'a[href^="#"]'
  )
  .forEach((link) => {

    link.addEventListener(
      "click",
      (event) => {

        const targetId =
          link.getAttribute("href");


        if (
          !targetId ||
          targetId === "#"
        ) {

          return;

        }


        const target =
          document.querySelector(
            targetId
          );


        if (!target) return;


        event.preventDefault();


        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }
    );

  });


/* =========================================================
   APPLICATION INITIALISATION
========================================================= */

(async function initialiseApp() {

  try {

    /*
      Invitation links must be processed first.
    */

    if (isInvitationLink()) {

      await handleInvitationFlow();

      return;

    }


    /*
      Check whether a user is already logged in.
    */

    const {
      data,
      error
    } =
      await supabase.auth.getSession();


    if (error) {

      console.error(
        "Initial session error:",
        error
      );

      return;

    }


    if (data?.session?.user) {

      currentUser =
        data.session.user;

    }


  } catch (error) {

    console.error(
      "Application initialisation error:",
      error
    );

  }

})();
