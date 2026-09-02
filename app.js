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


document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});


if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

const menuToggle = $("menuToggle");
const mobileNav = $("mobileNav");

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("show");
  });
}


document.querySelectorAll("#mobileNav a").forEach((link) => {
  link.addEventListener("click", () => {
    if (mobileNav) {
      mobileNav.classList.remove("show");
    }
  });
});


/* =========================================================
   PORTAL
========================================================= */

function openPortal() {
  if (!portal) return;

  portal.classList.add("show");
  document.body.style.overflow = "hidden";

  checkCurrentUser();
}


function closePortal() {
  if (!portal) return;

  portal.classList.remove("show");
  document.body.style.overflow = "";
}


const portalOpenButtons = document.querySelectorAll(
  "[data-open-portal], #portalButton"
);

portalOpenButtons.forEach((button) => {
  button.addEventListener("click", openPortal);
});


const portalCloseButton = $("portalClose");

if (portalCloseButton) {
  portalCloseButton.addEventListener("click", closePortal);
}


if (portal) {
  portal.addEventListener("click", (event) => {
    if (event.target === portal) {
      closePortal();
    }
  });
}


/* =========================================================
   PORTAL PANELS
========================================================= */

function showPanel(id) {
  document.querySelectorAll(".portal-panel").forEach((panel) => {
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

  const loginButton = $("loginTab");
  const signupButton = $("signupTab");

  if (loginButton) {
    loginButton.classList.toggle("active", mode === "login");
  }

  if (signupButton) {
    signupButton.classList.toggle("active", mode === "signup");
  }

  const submitButton = $("authSubmit");

  if (submitButton) {
    submitButton.textContent =
      mode === "login"
        ? "LOGIN"
        : "CREATE ACCOUNT";
  }

  const authTitle = $("authTitle");

  if (authTitle) {
    authTitle.textContent =
      mode === "login"
        ? "Welcome back."
        : "Create your account.";
  }

  const authMessage = $("authMessage");

  if (authMessage) {
    authMessage.textContent = "";
    authMessage.className = "auth-message";
  }
}


if ($("loginTab")) {
  $("loginTab").addEventListener("click", () => {
    setAuthMode("login");
  });
}


if ($("signupTab")) {
  $("signupTab").addEventListener("click", () => {
    setAuthMode("signup");
  });
}


/* =========================================================
   AUTH FORM
========================================================= */

const authForm = $("authForm");

if (authForm) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $("authEmail")?.value.trim();
    const password = $("authPassword")?.value;
    const fullName = $("authName")?.value.trim();

    const message = $("authMessage");
    const submitButton = $("authSubmit");

    if (!email || !password) {
      showMessage(
        message,
        "Please enter your email address and password.",
        "error"
      );
      return;
    }

    if (authMode === "signup" && !fullName) {
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
          ? "LOGGING IN..."
          : "CREATING ACCOUNT...";
    }

    try {
      if (authMode === "login") {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (error) throw error;

        currentUser = data.user;

        showMessage(
          message,
          "Login successful.",
          "success"
        );

        await loadUser();

      } else {
        const { data, error } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName
              }
            }
          });

        if (error) throw error;

        if (data.user) {
          currentUser = data.user;
        }

        showMessage(
          message,
          "Account created. Please check your email if confirmation is required.",
          "success"
        );

        if (data.session) {
          await loadUser();
        }
      }

    } catch (error) {
      console.error("Authentication error:", error);

      showMessage(
        message,
        error.message || "Something went wrong. Please try again.",
        "error"
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent =
          authMode === "login"
            ? "LOGIN"
            : "CREATE ACCOUNT";
      }
    }
  });
}


/* =========================================================
   INVITATION DETECTION
========================================================= */

function isInvitationLink() {
  const searchParams = new URLSearchParams(
    window.location.search
  );

  const hashParams = new URLSearchParams(
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
    const searchParams = new URLSearchParams(
      window.location.search
    );

    const tokenHash = searchParams.get("token_hash");

    /*
      Supabase invitation links can contain:

      ?token_hash=...&type=invite

      If a token hash is present, explicitly verify it.
    */

    if (tokenHash) {
      const { data, error } =
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "invite"
        });

      if (error) {
        console.error(
          "Invitation verification error:",
          error
        );

        showPanel("authPanel");

        const authMessage = $("authMessage");

        showMessage(
          authMessage,
          "This invitation link is invalid or has expired. Please ask your company administrator to send a new invitation.",
          "error"
        );

        return true;
      }

      if (data?.user) {
        currentUser = data.user;
      }
    }

    /*
      Supabase may already have processed the invitation
      URL and created a session.
    */

    const {
      data: sessionData
    } = await supabase.auth.getSession();

    const invitedUser =
      sessionData?.session?.user ||
      currentUser;

    if (!invitedUser) {
      showPanel("authPanel");

      const authMessage = $("authMessage");

      showMessage(
        authMessage,
        "Please use the invitation link from your email again.",
        "error"
      );

      return true;
    }

    currentUser = invitedUser;

    /*
      Open the portal directly.

      IMPORTANT:
      Do NOT call openPortal() here because openPortal()
      calls checkCurrentUser(), which would call this function
      again.
    */

    if (portal) {
      portal.classList.add("show");
      document.body.style.overflow = "hidden";
    }

    showPanel("invitePasswordPanel");

    const emailField = $("invitePasswordEmail");

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

    const authMessage = $("authMessage");

    showMessage(
      authMessage,
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

      if (!password || !confirmPassword) {
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

      if (password !== confirmPassword) {
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
        } = await supabase.auth.getSession();

        currentUser =
          sessionData?.session?.user || null;
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
        } = await supabase.auth.updateUser({
          password
        });

        if (error) throw error;

        currentUser =
          data?.user || currentUser;

        showMessage(
          message,
          "Your password has been created successfully. Loading your company account...",
          "success"
        );

        /*
          Give Supabase a moment to finish updating
          the session before loading the portal.
        */

        await new Promise((resolve) =>
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
    /*
      Check invitation before normal login flow.
    */

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
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (data.session?.user) {
      currentUser = data.session.user;

      await loadUser();

    } else {
      showPanel("authPanel");
    }

  } catch (error) {
    console.error(
      "Session error:",
      error
    );

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
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Profile loading error:",
        profileError
      );
    }

    currentProfile = profile || null;

    /*
      Admin users get the admin portal.
    */

    if (currentProfile?.is_admin === true) {
      await loadAdminPortal();
      showPanel("adminPanel");
      return;
    }

    /*
      Normal users get the customer portal.
    */

    await loadCustomerPortal();
    showPanel("customerPanel");

  } catch (error) {
    console.error(
      "Load user error:",
      error
    );

    showPanel("authPanel");

    const authMessage =
      $("authMessage");

    showMessage(
      authMessage,
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
    /*
      Load company membership.
    */

    const {
      data: membership,
      error: membershipError
    } = await supabase
      .from("company_members")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Membership loading error:",
        membershipError
      );
    }

    currentMembership =
      membership || null;

    /*
      Load company.
    */

    if (currentMembership?.company_id) {
      const {
        data: company,
        error: companyError
      } = await supabase
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
      currentCompany = null;
    }

    /*
      Populate dashboard.
    */

    populateCustomerDetails();

    /*
      Load orders and team.
    */

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
   POPULATE CUSTOMER DETAILS
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

  /*
    Common customer portal fields.
  */

  const nameElements = [
    $("customerName"),
    $("dashboardName"),
    $("profileName")
  ];

  nameElements.forEach((element) => {
    if (element) {
      element.textContent = userName;
    }
  });

  const emailElements = [
    $("customerEmail"),
    $("profileEmail")
  ];

  emailElements.forEach((element) => {
    if (element) {
      element.textContent = userEmail;
    }
  });

  const companyElements = [
    $("customerCompany"),
    $("dashboardCompany"),
    $("profileCompany")
  ];

  companyElements.forEach((element) => {
    if (element) {
      element.textContent = companyName;
    }
  });

  /*
    Input fields.
  */

  const nameInput =
    $("profileNameInput");

  if (nameInput) {
    nameInput.value = userName;
  }

  const emailInput =
    $("profileEmailInput");

  if (emailInput) {
    emailInput.value = userEmail;
  }

  const companyInput =
    $("companyNameInput");

  if (companyInput) {
    companyInput.value =
      currentCompany?.name || "";
  }
}


/* =========================================================
   CUSTOMER ORDERS
========================================================= */

async function loadCustomerOrders() {
  if (!currentUser) return;

  const ordersContainer =
    $("customerOrders");

  if (!ordersContainer) return;

  if (!currentCompany?.id) {
    ordersContainer.innerHTML = `
      <div class="empty-state">
        <p>No company account is linked to your account yet.</p>
      </div>
    `;
    return;
  }

  try {
    const {
      data: orders,
      error
    } = await supabase
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

    if (error) throw error;

    if (!orders || orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-state">
          <p>You don't have any orders yet.</p>
        </div>
      `;

      return;
    }

    ordersContainer.innerHTML =
      orders.map((order) => `
        <div class="order-card">

          <div class="order-card-top">

            <div>
              <strong>
                Order #${escapeHtml(
                  order.order_number ||
                  order.id?.slice(0, 8) ||
                  ""
                )}
              </strong>

              <span>
                ${order.created_at
                  ? new Date(
                      order.created_at
                    ).toLocaleDateString(
                      "en-GB"
                    )
                  : ""}
              </span>
            </div>

            <div>
              <span class="status">
                ${escapeHtml(
                  order.status ||
                  "Processing"
                )}
              </span>
            </div>

          </div>

          <div class="order-card-bottom">

            <div>
              <small>Total</small>
              <strong>
                £${Number(
                  order.total || 0
                ).toFixed(2)}
              </strong>
            </div>

            <div>
              <small>Delivery</small>
              <strong>
                ${escapeHtml(
                  order.tracking_status ||
                  order.status ||
                  "Processing"
                )}
              </strong>
            </div>

          </div>

        </div>
      `).join("");

  } catch (error) {
    console.error(
      "Customer orders error:",
      error
    );

    ordersContainer.innerHTML = `
      <div class="empty-state">
        <p>Unable to load your orders right now.</p>
      </div>
    `;
  }
}


/* =========================================================
   COMPANY TEAM
========================================================= */

async function loadCompanyTeam() {
  if (!currentCompany?.id) {
    renderCompanyTeam([]);
    return;
  }

  try {
    const {
      data: members,
      error
    } = await supabase
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

    if (error) throw error;

    renderCompanyTeam(
      members || []
    );

  } catch (error) {
    console.error(
      "Company team error:",
      error
    );

    renderCompanyTeam([]);
  }
}


/* =========================================================
   RENDER COMPANY TEAM
========================================================= */

function renderCompanyTeam(members) {
  const teamContainer =
    $("companyTeam");

  if (!teamContainer) return;

  if (!members.length) {
    teamContainer.innerHTML = `
      <div class="empty-state">
        <p>No employees have been added yet.</p>
      </div>
    `;

    return;
  }

  teamContainer.innerHTML =
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
}


/* =========================================================
   INVITE EMPLOYEE
========================================================= */

const inviteEmployeeForm =
  $("inviteEmployeeForm");

if (inviteEmployeeForm) {

  inviteEmployeeForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        $("employeeEmail")?.value
          .trim()
          .toLowerCase();

      const message =
        $("inviteEmployeeMessage");

      const submitButton =
        $("inviteEmployeeSubmit");

      if (!email) {
        showMessage(
          message,
          "Please enter an employee email address.",
          "error"
        );
        return;
      }

      if (!currentCompany?.id) {
        showMessage(
          message,
          "Your account is not linked to a company.",
          "error"
        );
        return;
      }

      try {

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent =
            "SENDING...";
        }

        const {
          data: sessionData
        } = await supabase.auth.getSession();

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
        } = await supabase.auth.getUser();

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
        } = await supabase.functions.invoke(
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

        showMessage(
          message,
          "Invitation sent successfully. The employee will receive an email with a link to create their password.",
          "success"
        );

        if ($("employeeEmail")) {
          $("employeeEmail").value = "";
        }

        await loadCompanyTeam();

      } catch (error) {

        console.error(
          "Employee invitation error:",
          error
        );

        showMessage(
          message,
          error.message ||
            "Unable to send the invitation.",
          "error"
        );

      } finally {

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent =
            "INVITE EMPLOYEE";
        }
      }
    }
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
  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "Admin";

  const email =
    currentUser?.email ||
    "";

  const nameElements = [
    $("adminName"),
    $("adminDashboardName")
  ];

  nameElements.forEach((element) => {
    if (element) {
      element.textContent = name;
    }
  });

  const emailElements = [
    $("adminEmail")
  ];

  emailElements.forEach((element) => {
    if (element) {
      element.textContent = email;
    }
  });
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
    } = await supabase
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) throw error;

    if (!products?.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No products have been added yet.</p>
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
                product.name || "Product"
              )}
            </strong>

            <span>
              ${escapeHtml(
                product.category || ""
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
        <p>Unable to load products.</p>
      </div>
    `;
  }
}


/* =========================================================
   ADMIN ORDERS
========================================================= */

async function loadAdminOrders() {
  const container =
    $("adminOrders");

  if (!container) return;

  try {

    const {
      data: orders,
      error
    } = await supabase
      .from("orders")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) throw error;

    if (!orders?.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No orders have been placed yet.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      orders.map((order) => `
        <div class="admin-order">

          <div>
            <strong>
              Order #${escapeHtml(
                order.order_number ||
                order.id?.slice(0, 8) ||
                ""
              )}
            </strong>

            <span>
              ${order.created_at
                ? new Date(
                    order.created_at
                  ).toLocaleDateString(
                    "en-GB"
                  )
                : ""}
            </span>
          </div>

          <div>
            £${Number(
              order.total || 0
            ).toFixed(2)}
          </div>

          <div>
            ${escapeHtml(
              order.status ||
              "Processing"
            )}
          </div>

        </div>
      `).join("");

  } catch (error) {

    console.error(
      "Admin orders error:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        <p>Unable to load orders.</p>
      </div>
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
    } = await supabase
      .from("companies")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) throw error;

    if (!companies?.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No companies have been added yet.</p>
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
        <p>Unable to load companies.</p>
      </div>
    `;
  }
}


/* =========================================================
   CUSTOMER PANEL NAVIGATION
========================================================= */

document
  .querySelectorAll(
    "[data-customer-panel]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const panel =
          button.dataset.customerPanel;

        if (panel) {
          showPanel(panel);
        }

      }
    );

  });


/* =========================================================
   ADMIN PANEL NAVIGATION
========================================================= */

document
  .querySelectorAll(
    "[data-admin-panel]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const panel =
          button.dataset.adminPanel;

        if (panel) {
          showPanel(panel);
        }

      }
    );

  });


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {
  try {

    const {
      error
    } = await supabase.auth.signOut();

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


document
  .querySelectorAll(
    "[data-logout], #logoutButton, #adminLogout"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      logout
    );

  });


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

    /*
      Don't automatically reload the entire portal
      on every auth event.

      Invitation password setup is handled separately.
    */

    if (
      event === "SIGNED_OUT"
    ) {
      currentProfile = null;
      currentCompany = null;
      currentMembership = null;

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
        Netlify Forms handles this form.
        We only provide UI feedback here.
      */

      const submitButton =
        enquiryForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent =
          "SENDING...";
      }

    }
  );
}


/* =========================================================
   SCROLL / HEADER EFFECT
========================================================= */

const header =
  document.querySelector(
    "header"
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
   SUPABASE INITIALISATION
========================================================= */

(async function initialiseApp() {

  try {

    /*
      If the page was opened directly from a Supabase
      invitation email, process the invitation first.
    */

    if (isInvitationLink()) {

      await handleInvitationFlow();

      return;
    }

    /*
      Otherwise make sure any existing session is
      available for the portal.
    */

    const {
      data
    } = await supabase.auth.getSession();

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
