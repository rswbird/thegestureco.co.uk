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
const mobileMenu = $("mobileMenu");


function openModal() {
  if (!modal) return;

  modal.classList.add("open");

  document.body.style.overflow = "hidden";
}


function closeModal() {
  if (!modal) return;

  modal.classList.remove("open");

  if (!portal?.classList.contains("show")) {
    document.body.style.overflow = "";
  }
}


function openPortal() {
  if (!portal) return;

  portal.classList.add("show");

  document.body.style.overflow = "hidden";

  checkCurrentUser();
}


function closePortal() {
  if (!portal) return;

  portal.classList.remove("show");

  if (!modal?.classList.contains("open")) {
    document.body.style.overflow = "";
  }
}


function closeMobileMenu() {
  if (!mobileMenu) return;

  mobileMenu.classList.remove("open");

  $("menuButton")?.setAttribute(
    "aria-expanded",
    "false"
  );
}


function showPanel(id) {

  document
    .querySelectorAll(".portal-panel")
    .forEach(panel => {
      panel.classList.remove("active");
    });

  const panel = $(id);

  if (panel) {
    panel.classList.add("active");
  }
}


function money(value) {

  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(amount);
}


function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}


function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   MOBILE MENU
========================================================= */

$("menuButton")?.addEventListener(
  "click",
  () => {

    const isOpen =
      mobileMenu.classList.toggle("open");

    $("menuButton").setAttribute(
      "aria-expanded",
      String(isOpen)
    );

  }
);


document
  .querySelectorAll(".mobile-menu a")
  .forEach(link => {

    link.addEventListener(
      "click",
      closeMobileMenu
    );

  });


$("mobileEnquire")?.addEventListener(
  "click",
  () => {

    closeMobileMenu();

    openModal();

  }
);


/* =========================================================
   ENQUIRY MODAL
========================================================= */

[
  "navEnquire",
  "heroQuote",
  "heroBespoke",
  "corporateEnquire",
  "bespokeEnquire",
  "ctaContact",
  "personalGift"
].forEach(id => {

  const button = $(id);

  if (button) {
    button.addEventListener(
      "click",
      openModal
    );
  }

});


$("closeModal")?.addEventListener(
  "click",
  closeModal
);


modal?.addEventListener(
  "click",
  event => {

    if (event.target === modal) {
      closeModal();
    }

  }
);


/* =========================================================
   ENQUIRY FORM
========================================================= */

$("enquiryForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const button = $("enquirySubmit");

    button.disabled = true;
    button.textContent = "SENDING...";

    $("error").style.display = "none";

    const formData = {

      name:
        $("name").value.trim(),

      email:
        $("email").value.trim(),

      company:
        $("company").value.trim(),

      enquiry_type:
        $("enquiry_type").value,

      quantity:
        $("quantity").value
          ? Number($("quantity").value)
          : null,

      budget:
        $("budget").value.trim(),

      timeline:
        $("timeline").value || null,

      phone:
        $("phone").value.trim(),

      message:
        $("message").value.trim()

    };


    try {

      const {
        error
      } = await supabase.functions.invoke(
        "submit-enquiry",
        {
          body: formData
        }
      );


      if (error) {
        throw error;
      }


      $("enquiryForm").style.display =
        "none";

      $("success").style.display =
        "block";


    } catch (error) {

      console.error(
        "Enquiry error:",
        error
      );

      $("error").style.display =
        "block";

      button.disabled = false;

      button.textContent =
        "SEND ENQUIRY";

    }

  }
);


/* =========================================================
   AUTH MODE
========================================================= */

$("toggleAuth")?.addEventListener(
  "click",
  () => {

    if (authMode === "login") {

      authMode = "signup";

      $("authTitle").textContent =
        "Create your account.";

      $("authSubtitle").textContent =
        "Create an account to manage your company, orders and documents.";

      $("authSubmit").textContent =
        "CREATE ACCOUNT";

      $("toggleAuth").textContent =
        "Already have an account? Sign in";

      $("signupNameField")
        .classList
        .remove("hidden");

    } else {

      authMode = "login";

      $("authTitle").textContent =
        "Welcome back.";

      $("authSubtitle").textContent =
        "Sign in to manage your company, orders and documents.";

      $("authSubmit").textContent =
        "SIGN IN";

      $("toggleAuth").textContent =
        "Need an account? Create one";

      $("signupNameField")
        .classList
        .add("hidden");

    }

  }
);


/* =========================================================
   AUTH FORM
========================================================= */

$("authForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const email =
      $("authEmail").value.trim();

    const password =
      $("authPassword").value;

    const fullName =
      $("signupName").value.trim();

    const button =
      $("authSubmit");

    const message =
      $("authMessage");


    button.disabled = true;

    message.textContent = "";


    try {

      /* LOGIN */

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


        await loadUser();

      }


      /* SIGN UP */

      else {

        const {
          data,
          error
        } =
          await supabase.auth.signUp({

            email,

            password,

            options: {
              data: {
                full_name:
                  fullName
              }
            }

          });


        if (error) {
          throw error;
        }


        if (!data.session) {

          message.className =
            "auth-message success-message";

          message.textContent =
            "Account created. Please check your email to confirm your account before signing in.";

        } else {

          currentUser =
            data.user;

          await loadUser();

        }

      }


    } catch (error) {

      console.error(error);

      message.className =
        "auth-message error-message";

      message.textContent =
        error.message ||
        "Something went wrong.";

    } finally {

      button.disabled = false;

    }

  }
);


/* =========================================================
   CHECK CURRENT USER
========================================================= */

async function checkCurrentUser() {

  try {

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
    return;
  }


  const {
    data: profile,
    error
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

    $("authMessage").className =
      "auth-message error-message";

    $("authMessage").textContent =
      "Your account exists, but your profile could not be loaded.";

    showPanel("authPanel");

    return;

  }


  currentProfile =
    profile;


  if (profile?.is_admin === true) {

    showPanel("adminPanel");

    await loadAdmin();

  } else {

    showPanel("customerPanel");

    await loadCustomerPortal();

  }

}


/* =========================================================
   CUSTOMER PORTAL
========================================================= */

async function loadCustomerPortal() {
  try {
    if (!currentUser) {
      throw new Error("No authenticated user found.");
    }

    // ---------------------------------------------------------
    // 1. Load the user's company membership
    // ---------------------------------------------------------

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("id, company_id, role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "[The Gesture Co.] Company membership error:",
        membershipError
      );

      throw membershipError;
    }

    if (!membership) {
      currentCompany = null;
      currentMembership = null;

      document.getElementById("customerWelcome").textContent =
        `Welcome, ${currentProfile?.full_name || "there"}.`;

      document.getElementById("companyDetails").innerHTML = `
        <div class="notice">
          Your account is not currently connected to a company.
          Please contact The Gesture Co. to have your account connected.
        </div>
      `;

      document.getElementById("activeOrders").textContent = "0";
      document.getElementById("totalOrders").textContent = "0";
      document.getElementById("teamUsers").textContent = "0";

      document.getElementById("ordersBody").innerHTML = "";
      document.getElementById("teamList").innerHTML = "";

      return;
    }

    currentMembership = membership;

    console.log(
      "[The Gesture Co.] Company membership loaded:",
      membership
    );


    // ---------------------------------------------------------
    // 2. Load the company separately
    // ---------------------------------------------------------

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        contact_email,
        phone,
        address_line_1,
        address_line_2,
        city,
        postcode
      `)
      .eq("id", membership.company_id)
      .maybeSingle();

    if (companyError) {
      console.error(
        "[The Gesture Co.] Company details error:",
        companyError
      );

      throw companyError;
    }

    if (!company) {
      throw new Error(
        "The company membership exists, but the company record could not be loaded."
      );
    }

    currentCompany = company;

    console.log(
      "[The Gesture Co.] Company loaded:",
      company
    );


    // ---------------------------------------------------------
    // 3. Welcome message
    // ---------------------------------------------------------

    document.getElementById("customerWelcome").textContent =
      `Welcome, ${currentProfile?.full_name || "there"}.`;


    // ---------------------------------------------------------
    // 4. Company details
    // ---------------------------------------------------------

    const addressParts = [
      company.address_line_1,
      company.address_line_2,
      company.city,
      company.postcode
    ].filter(Boolean);

    document.getElementById("companyDetails").innerHTML = `
      <div>
        <strong>${escapeHtml(company.name || "")}</strong>
      </div>

      ${
        company.contact_email
          ? `<div>${escapeHtml(company.contact_email)}</div>`
          : ""
      }

      ${
        company.phone
          ? `<div>${escapeHtml(company.phone)}</div>`
          : ""
      }

      ${
        addressParts.length
          ? `<div>${addressParts.map(escapeHtml).join("<br>")}</div>`
          : ""
      }

      <div class="company-role">
        Your role: ${escapeHtml(
          currentMembership.role || "member"
        )}
      </div>
    `;


    // ---------------------------------------------------------
    // 5. Load orders
    // ---------------------------------------------------------

    await loadCustomerOrders();


    // ---------------------------------------------------------
    // 6. Load company team
    // ---------------------------------------------------------

    await loadCompanyTeam();


  } catch (error) {

    console.error(
      "[The Gesture Co.] Customer portal error:",
      error
    );

    document.getElementById("companyDetails").innerHTML = `
      <div class="error">
        Unable to load your company details.
      </div>
    `;

    document.getElementById("ordersBody").innerHTML = "";
    document.getElementById("teamList").innerHTML = "";

    document.getElementById("activeOrders").textContent = "0";
    document.getElementById("totalOrders").textContent = "0";
    document.getElementById("teamUsers").textContent = "0";
  }
}

  $("customerWelcome").textContent =
    `Welcome${
      currentProfile?.full_name
        ? ", " + currentProfile.full_name
        : ""
    }.`;

  currentCompany = null;
  currentMembership = null;


  const {
    data: membership,
    error
  } =
    await supabase
      .from("company_members")
      .select(`
        id,
        company_id,
        role,
        companies (
          id,
          name,
          contact_email,
          phone,
          address_line_1,
          address_line_2,
          city,
          postcode
        )
      `)
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Company membership error:",
      error
    );

    $("companyDetails").innerHTML =
      `<div class="error-message">
        Unable to load your company details.
      </div>`;

    return;

  }


  if (!membership) {

    $("companyDetails").innerHTML = `
      <div class="notice">
        Your account has been created, but it has not yet been connected to a company.
        Please contact The Gesture Co. to finish setting up your account.
      </div>
    `;

    $("activeOrders").textContent =
      "0";

    $("totalOrders").textContent =
      "0";

    $("teamUsers").textContent =
      "0";

    $("ordersBody").innerHTML = "";

    $("teamList").innerHTML = "";

    return;

  }


  currentMembership =
    membership;

  currentCompany =
    membership.companies;


  if (!currentCompany) {

    $("companyDetails").innerHTML =
      `<div class="error-message">
        Your company could not be found.
      </div>`;

    return;

  }


  $("companyDetails").innerHTML = `

    <div>

      <span class="small-label">
        COMPANY
      </span>

      <strong>
        ${escapeHtml(
          currentCompany.name
        )}
      </strong>

    </div>

    <div>

      <span class="small-label">
        ROLE
      </span>

      <strong>
        ${escapeHtml(
          membership.role || "Member"
        )}
      </strong>

    </div>

  `;


  await loadCustomerOrders();

  await loadCompanyTeam();

}


/* =========================================================
   CUSTOMER ORDERS
========================================================= */

async function loadCustomerOrders() {

  if (!currentCompany?.id) {
    return;
  }


  const {
    data: orders,
    error
  } =
    await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        company_id,
        status,
        total_amount,
        created_at,
        updated_at,
        invoices (
          id,
          invoice_number,
          file_path,
          amount,
          issued_at
        ),
        shipments (
          id,
          courier,
          tracking_number,
          tracking_url,
          status,
          estimated_delivery,
          delivered_at
        )
      `)
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

    console.error(
      "Orders error:",
      error
    );

    $("ordersBody").innerHTML = `
      <tr>
        <td colspan="5">
          Unable to load orders.
        </td>
      </tr>
    `;

    return;

  }


  const orderList =
    orders || [];


  $("totalOrders").textContent =
    orderList.length;


  const active =
    orderList.filter(order => {

      const status =
        String(
          order.status || ""
        ).toLowerCase();

      return ![
        "delivered",
        "cancelled",
        "complete",
        "completed"
      ].includes(status);

    });


  $("activeOrders").textContent =
    active.length;


  if (!orderList.length) {

    $("ordersBody").innerHTML = `
      <tr>
        <td colspan="5">
          You don't have any orders yet.
        </td>
      </tr>
    `;

    return;

  }


  $("ordersBody").innerHTML =
    orderList.map(order => {

      const shipment =
        Array.isArray(order.shipments)
          ? order.shipments[0]
          : order.shipments;


      const invoice =
        Array.isArray(order.invoices)
          ? order.invoices[0]
          : order.invoices;


      let delivery = "—";


      if (shipment?.delivered_at) {

        delivery =
          `Delivered ${formatDate(
            shipment.delivered_at
          )}`;

      } else if (
        shipment?.estimated_delivery
      ) {

        delivery =
          `Expected ${formatDate(
            shipment.estimated_delivery
          )}`;

      } else if (
        shipment?.tracking_url
      ) {

        delivery = `
          <a
            class="tracking-link"
            href="${escapeHtml(
              shipment.tracking_url
            )}"
            target="_blank"
            rel="noopener">
            TRACK DELIVERY
          </a>
        `;

      }


      let invoiceHtml = "—";


      if (invoice?.file_path) {

        invoiceHtml = `
          <button
            class="btn small"
            data-invoice="${escapeHtml(
              invoice.file_path
            )}">
            DOWNLOAD
          </button>
        `;

      }


      return `

        <tr>

          <td>
            #TG-${escapeHtml(
              order.order_number
            )}
          </td>

          <td>
            <span class="status">
              ${escapeHtml(
                order.status ||
                "Processing"
              )}
            </span>
          </td>

          <td>
            ${money(
              order.total_amount
            )}
          </td>

          <td>
            ${delivery}
          </td>

          <td>
            ${invoiceHtml}
          </td>

        </tr>

      `;

    }).join("");


  document
    .querySelectorAll("[data-invoice]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          downloadInvoice(
            button.dataset.invoice
          );

        }
      );

    });

}


/* =========================================================
   INVOICE DOWNLOAD
========================================================= */

async function downloadInvoice(
  filePath
) {

  if (!filePath) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabase
        .storage
        .from("invoices")
        .createSignedUrl(
          filePath,
          300
        );


    if (error) {
      throw error;
    }


    window.open(
      data.signedUrl,
      "_blank",
      "noopener"
    );


  } catch (error) {

    console.error(
      "Invoice error:",
      error
    );

    alert(
      "We couldn't open the invoice. Please contact The Gesture Co."
    );

  }

}


/* =========================================================
   COMPANY TEAM
========================================================= */

async function loadCompanyTeam() {

  if (!currentCompany?.id) {
    return;
  }


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
      );


  if (error) {

    console.error(
      "Team error:",
      error
    );

    $("teamList").innerHTML =
      `<div class="error-message">
        Unable to load team.
      </div>`;

    return;

  }


  const list =
    members || [];


  $("teamUsers").textContent =
    list.length;


  if (!list.length) {

    $("teamList").innerHTML =
      "<p>No team members found.</p>";

    return;

  }


  $("teamList").innerHTML =
    list.map(member => {

      const profile =
        Array.isArray(
          member.profiles
        )
          ? member.profiles[0]
          : member.profiles;


      return `

        <div class="team-member">

          <div>

            <strong>
              ${escapeHtml(
                profile?.full_name ||
                "Team member"
              )}
            </strong>

            <span>
              ${escapeHtml(
                profile?.email || ""
              )}
            </span>

          </div>

          <small>
            ${escapeHtml(
              member.role ||
              "Member"
            )}
          </small>

        </div>

      `;

    }).join("");

}


/* =========================================================
   EMPLOYEE INVITATIONS
========================================================= */

$("inviteButton")?.addEventListener(
  "click",
  async () => {

    const email =
      $("inviteEmail")
        .value
        .trim();


    if (!email) {

      $("inviteMessage").innerHTML =
        `<div class="error-message">
          Please enter an email address.
        </div>`;

      return;

    }


    if (!currentCompany?.id) {

      $("inviteMessage").innerHTML =
        `<div class="error-message">
          Your account is not connected to a company.
        </div>`;

      return;

    }


    try {

      $("inviteButton").disabled =
        true;

      $("inviteButton").textContent =
        "SENDING...";


      const {
        error
      } =
        await supabase.functions.invoke(
          "invite-company-member",
          {
            body: {
              email,
              company_id:
                currentCompany.id
            }
          }
        );


      if (error) {
        throw error;
      }


      $("inviteMessage").innerHTML =
        `<div class="success-message">
          Invitation sent successfully.
        </div>`;


      $("inviteEmail").value =
        "";


    } catch (error) {

      console.error(error);

      $("inviteMessage").innerHTML =
        `<div class="error-message">
          We couldn't send the invitation yet.
          Please try again later.
        </div>`;

    } finally {

      $("inviteButton").disabled =
        false;

      $("inviteButton").textContent =
        "INVITE EMPLOYEE";

    }

  }
);


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error(error);
  }


  currentUser = null;
  currentProfile = null;
  currentCompany = null;
  currentMembership = null;

  authMode = "login";


  $("authTitle").textContent =
    "Welcome back.";

  $("authSubtitle").textContent =
    "Sign in to manage your company, orders and documents.";

  $("authSubmit").textContent =
    "SIGN IN";

  $("toggleAuth").textContent =
    "Need an account? Create one";

  $("signupNameField")
    ?.classList
    .add("hidden");


  showPanel("authPanel");

}


$("customerLogout")?.addEventListener(
  "click",
  logout
);

$("adminLogout")?.addEventListener(
  "click",
  logout
);


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function loadAdmin() {

  await loadAdminProducts();

  await loadAdminOrders();

  await loadAdminCompanies();

}


/* =========================================================
   ADMIN PRODUCTS
========================================================= */

async function loadAdminProducts() {

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

    console.error(error);

    $("adminProducts").innerHTML =
      `<div class="error-message">
        Unable to load products.
      </div>`;

    return;

  }


  if (!products?.length) {

    $("adminProducts").innerHTML =
      "<p>No products have been added yet.</p>";

    return;

  }


  $("adminProducts").innerHTML =
    products.map(product => `

      <div class="product-item">

        ${
          product.image_url
            ? `
              <img
                src="${escapeHtml(
                  product.image_url
                )}"
                alt="${escapeHtml(
                  product.name
                )}">
            `
            : ""
        }

        <strong>
          ${escapeHtml(
            product.name
          )}
        </strong>

        <span>
          ${money(
            product.price
          )}
        </span>

        <small>
          ${escapeHtml(
            product.category ||
            "Product"
          )}
        </small>

        <small>
          ${
            product.active
              ? "ACTIVE"
              : "INACTIVE"
          }
        </small>

        <button
          class="btn small product-toggle"
          data-product-id="${escapeHtml(
            product.id
          )}"
          data-active="${product.active}">
          ${
            product.active
              ? "DEACTIVATE"
              : "ACTIVATE"
          }
        </button>

      </div>

    `).join("");


  document
    .querySelectorAll(
      ".product-toggle"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const productId =
            button.dataset.productId;

          const currentlyActive =
            button.dataset.active ===
            "true";


          await updateProductStatus(
            productId,
            !currentlyActive
          );

        }
      );

    });

}


/* =========================================================
   PRODUCT STATUS
========================================================= */

async function updateProductStatus(
  productId,
  active
) {

  const {
    error
  } =
    await supabase
      .from("products")
      .update({
        active
      })
      .eq(
        "id",
        productId
      );


  if (error) {

    console.error(error);

    alert(
      "Unable to update product."
    );

    return;

  }


  await loadAdminProducts();

}


/* =========================================================
   ADD PRODUCT
========================================================= */

$("productForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      $("productName")
        .value
        .trim();


    const slugInput =
      $("productSlug")
        .value
        .trim();


    const slug =
      slugInput ||
      name
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );


    const price =
      Number(
        $("productPrice").value
      );


    const category =
      $("productCategory").value;


    const minimumQuantity =
      Number(
        $("productMinimum").value ||
        1
      );


    const description =
      $("productDescription")
        .value
        .trim();


    const image =
      $("productImage")
        .files[0];


    try {

      $("productMessage").innerHTML =
        `<div class="notice">
          Saving product...
        </div>`;


      let imageUrl = null;


      if (image) {

        const fileExtension =
          image.name
            .split(".")
            .pop()
            .toLowerCase();


        const fileName =
          `${crypto.randomUUID()}.${fileExtension}`;


        const {
          error: uploadError
        } =
          await supabase
            .storage
            .from("products")
            .upload(
              fileName,
              image,
              {
                cacheControl:
                  "3600",
                upsert: false,
                contentType:
                  image.type
              }
            );


        if (uploadError) {
          throw uploadError;
        }


        const {
          data: publicUrl
        } =
          supabase
            .storage
            .from("products")
            .getPublicUrl(
              fileName
            );


        imageUrl =
          publicUrl.publicUrl;

      }


      const {
        error
      } =
        await supabase
          .from("products")
          .insert({

            name,

            slug,

            description,

            category,

            price,

            minimum_quantity:
              minimumQuantity,

            image_url:
              imageUrl,

            active: true

          });


      if (error) {
        throw error;
      }


      $("productForm").reset();

      $("productMinimum").value =
        "1";


      $("productMessage").innerHTML =
        `<div class="success-message">
          Product added successfully.
        </div>`;


      await loadAdminProducts();


    } catch (error) {

      console.error(error);

      $("productMessage").innerHTML =
        `<div class="error-message">
          ${escapeHtml(
            error.message ||
            "Unable to save product."
          )}
        </div>`;

    }

  }
);


/* =========================================================
   ADMIN ORDERS
========================================================= */

async function loadAdminOrders() {

  const {
    data: orders,
    error
  } =
    await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        total_amount,
        created_at,
        companies (
          name
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(100);


  if (error) {

    console.error(error);

    $("adminOrdersBody").innerHTML = `
      <tr>
        <td colspan="5">
          Unable to load orders.
        </td>
      </tr>
    `;

    return;

  }


  $("adminOrdersBody").innerHTML =
    (orders || [])
      .map(order => `

        <tr>

          <td>
            #TG-${escapeHtml(
              order.order_number
            )}
          </td>

          <td>
            ${escapeHtml(
              order.companies?.name ||
              "—"
            )}
          </td>

          <td>
            <span class="status">
              ${escapeHtml(
                order.status ||
                "Processing"
              )}
            </span>
          </td>

          <td>
            ${money(
              order.total_amount
            )}
          </td>

          <td>
            ${formatDate(
              order.created_at
            )}
          </td>

        </tr>

      `)
      .join("") ||

      `
        <tr>
          <td colspan="5">
            No orders yet.
          </td>
        </tr>
      `;

}


/* =========================================================
   ADMIN COMPANIES
========================================================= */

async function loadAdminCompanies() {

  const {
    data: companies,
    error
  } =
    await supabase
      .from("companies")
      .select(`
        id,
        name,
        contact_email,
        phone,
        city,
        postcode,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    $("adminCompanies").innerHTML =
      `<div class="error-message">
        Unable to load companies.
      </div>`;

    return;

  }


  if (!companies?.length) {

    $("adminCompanies").innerHTML =
      "<p>No companies have been added yet.</p>";

    return;

  }


  $("adminCompanies").innerHTML = `

    <div class="company-admin-list">

      ${
        companies.map(company => `

          <div class="company-admin-item">

            <div>

              <strong>
                ${escapeHtml(
                  company.name
                )}
              </strong>

              <span>
                ${escapeHtml(
                  company.contact_email ||
                  "No email"
                )}
              </span>

            </div>

            <small>
              ${escapeHtml(
                company.city || ""
              )}

              ${
                company.postcode
                  ? " · " +
                    escapeHtml(
                      company.postcode
                    )
                  : ""
              }
            </small>

          </div>

        `).join("")
      }

    </div>

  `;

}


/* =========================================================
   AUTH STATE
========================================================= */

supabase.auth.onAuthStateChange(
  async (_event, session) => {

    if (session?.user) {

      currentUser =
        session.user;

    } else {

      currentUser =
        null;

    }

  }
);


/* =========================================================
   PORTAL CONTROLS
========================================================= */

$("accountButton")?.addEventListener(
  "click",
  openPortal
);


$("portalClose")?.addEventListener(
  "click",
  closePortal
);


portal?.addEventListener(
  "click",
  event => {

    if (event.target === portal) {
      closePortal();
    }

  }
);


document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeModal();

      closePortal();

      closeMobileMenu();

    }

  }
);


/* =========================================================
   SCROLL REVEAL
========================================================= */

(function initScrollReveal() {

  const revealEls =
    document.querySelectorAll(
      "[data-reveal]"
    );


  if (!revealEls.length) {
    return;
  }


  if (
    !("IntersectionObserver" in window)
  ) {

    revealEls.forEach(
      el =>
        el.classList.add(
          "is-visible"
        )
    );

    return;

  }


  const io =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "is-visible"
              );

              io.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -40px 0px"
      }
    );


  revealEls.forEach(
    el => io.observe(el)
  );

})();


console.log(
  "[The Gesture Co.] Website loaded successfully."
);
