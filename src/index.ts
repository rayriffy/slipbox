import { html, type Html } from "@thai/html";
import { Elysia, t } from "elysia";
import generatePayload from "promptpay-qr";
import { loadBill, updateBill } from "./Bill";
import { pageResponse } from "./pageResponse";
import { pageScroller } from "./pageScroller";
import { validatePayload } from "./validatePayload";
import { verifyBill } from "./verifyBill";

export default new Elysia()
  .get(
    "/bills/:billId",
    async ({ params: { billId }, error }) => {
      const bill = await loadBill(billId);
      if (!bill) {
        return error(404, "Bill not found");
      }
      const billDetails: Html = bill.details
        ? [
            // prettier-ignore
            html`<div class="card mb-3" style="white-space:pre-line;padding:1rem;font-size:0.85em;background:#252423;margin-top:-0.5rem;">`,
            // prettier-ignore
            html`<strong class="text-muted" style="font-size:0.9em;text-transform:uppercase;">Details:</strong>`,
            bill.details.trim(),
            html`</div>`,
          ]
        : "";
      const promptpayPayload = generatePayload(Bun.env["PROMPTPAY_ID"]!, {
        amount: bill.amount,
      });
      const unpaid = () => {
        const renderPageHeader = (page: number, title: string) => {
          return html`<div
            class="slipbox-page-header d-flex justify-content-between align-items-center mb-3"
          >
            <div class="text-muted" style="flex: 1 0 0">Slipbox</div>
            <div class="text-muted text-center" style="flex: 2 0 0">
              <strong>${title}</strong>
            </div>
            <div class="text-muted text-end" style="flex: 1 0 0">
              Step ${page}/3
            </div>
          </div>`;
        };
        return html` ${pageScroller.runtime}
          <div class="slipbox-pages-scroller" data-page="1">
            <div class="slipbox-pages">
              <div class="slipbox-page" data-page-number="1">
                ${renderPageHeader(1, "Bill Details")}
                <div class="slipbox-page-content">
                  <p>
                    Hello, <strong class="text-name">${bill.payer}</strong>.
                  </p>
                  <p>
                    You received a bill from Thai for
                    <strong class="text-name">${bill.description}</strong>.
                  </p>
                  ${billDetails}
                  <p>
                    Please click the button below to proceed to the payment
                    page…
                  </p>
                </div>
                <div class="slipbox-buttons">
                  <button
                    class="btn btn-d4h d-flex justify-content-center align-items-center gap-1"
                    type="button"
                    onclick="navigatePage(this, 1)"
                  >
                    Transfer ฿${bill.amount}
                    <iconify-icon icon="mdi:chevron-right"></iconify-icon>
                  </button>
                </div>
              </div>
              <div class="slipbox-page" data-page-number="2">
                ${renderPageHeader(2, "Transfer")}
                <div class="slipbox-page-content">
                  <p>
                    Please transfer
                    <strong class="text-name">฿${bill.amount}</strong> to
                    <strong class="text-name"
                      >${Bun.env["OWNER_ACCOUNT_NAME"]?.split("|")[0]}</strong
                    >
                    via PromptPay using the following QR code:
                  </p>
                  <p class="text-center">
                    <span class="d-flex justify-content-center mb-1">
                      <span class="d-block p-2 bg-white rounded">
                        <qr-code text="${promptpayPayload}" size="10"></qr-code>
                      </span>
                    </span>
                    <small
                      class="text-muted lh-sm d-block mt-2"
                      style="text-wrap: balance"
                    >
                      Scan the above QR code with your mobile banking app or
                      take a screenshot and open it in your banking app.
                    </small>
                  </p>
                  <p>
                    After you have made the transfer, please click the button
                    below to upload the slip image.
                  </p>
                </div>
                <div class="slipbox-buttons">
                  <button
                    class="btn btn-outline-secondary d-flex justify-content-center align-items-center gap-1"
                    type="button"
                    onclick="navigatePage(this, -1)"
                  >
                    <iconify-icon icon="mdi:chevron-left"></iconify-icon>
                  </button>
                  <button
                    class="btn btn-d4h d-flex justify-content-center align-items-center gap-1"
                    type="button"
                    onclick="navigatePage(this, 1)"
                  >
                    Upload Slip
                    <iconify-icon icon="mdi:chevron-right"></iconify-icon>
                  </button>
                </div>
              </div>

              <div class="slipbox-page" data-page-number="3">
                ${renderPageHeader(3, "Upload Slip")}
                <div class="slipbox-page-content">
                  <p>
                    Please click the button below to upload the transfer slip
                    image:
                  </p>
                  <div class="d-flex justify-content-center flex-wrap gap-2">
                    <button
                      class="btn btn-d4h btn-lg d-flex justify-content-center align-items-center gap-1"
                      id="uploadSlip"
                      style="flex: 1"
                    >
                      <iconify-icon icon="mdi:upload"></iconify-icon>
                      Upload Slip Image
                    </button>
                    ${bill.verificationPayload
                      ? html`
                          <button
                            class="btn btn-warning d-inline-flex align-items-center gap-1"
                            type="button"
                            onClick="handlePayload(unescape('${escape(
                              bill.verificationPayload
                            )}'))"
                          >
                            Retry
                          </button>
                        `
                      : ""}
                  </div>
                  <div class="mt-1 text-muted text-center">
                    <small>— or —</small>
                  </div>
                  <div
                    class="mt-1 d-flex justify-content-center flex-wrap gap-2"
                  >
                    <button
                      class="btn btn-link text-muted d-inline-flex align-items-center gap-2 text-decoration-none"
                      id="scanSlip"
                    >
                      <small class="d-flex"
                        ><iconify-icon icon="mdi:scan-helper"></iconify-icon
                      ></small>
                      <small>Scan slip with camera</small>
                    </button>
                  </div>
                </div>
                <div class="slipbox-buttons">
                  <button
                    class="btn btn-outline-secondary d-flex justify-content-center align-items-center gap-1"
                    type="button"
                    onclick="navigatePage(this, -1)"
                  >
                    <iconify-icon icon="mdi:chevron-left"></iconify-icon>
                  </button>
                  <div></div>
                </div>
              </div>
            </div>
          </div>
          <form id="form" class="d-none" method="post">
            <input
              type="hidden"
              name="verificationPayload"
              id="verificationPayloadInput"
            />
          </form>
          <script>
            const uploadSlip = document.getElementById("uploadSlip");
            const scanSlip = document.getElementById("scanSlip");
            const form = document.getElementById("form");
            const verificationPayloadInput = document.getElementById(
              "verificationPayloadInput"
            );

            async function obtainImage() {
              try {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                return new Promise((resolve, reject) => {
                  input.addEventListener("change", () => {
                    if (!input.files || !input.files[0]) {
                      reject(new Error("No file selected"));
                      return;
                    }
                    const objectUrl = URL.createObjectURL(input.files[0]);
                    const image = new Image();
                    image.src = objectUrl;
                    image.onerror = () => {
                      URL.revokeObjectURL(objectUrl);
                      reject(new Error("Invalid image file"));
                    };
                    image.onload = () => {
                      URL.revokeObjectURL(objectUrl);
                      resolve(image);
                    };
                  });
                  input.addEventListener("cancel", () => {
                    reject(new Error("File selection cancelled"));
                  });
                  input.click();
                });
              } catch (error) {
                throw new Error(\`Failed to obtain image: \${error.message}\`);
              }
            }
            const zxingPromise = import(
              "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm"
            );
            const readerPromise = zxingPromise.then(
              ({ BrowserQRCodeReader, DecodeHintType }) => {
                // https://github.com/zxing-js/library/blob/master/src/core/DecodeHintType.ts
                const hints = new Map();
                hints.set(3, true);
                return new BrowserQRCodeReader(hints);
              }
            );
            async function handleImage(image) {
              const reader = await readerPromise;
              const result = await reader.decodeFromImageElement(image);
              return handlePayload(result.text);
            }
            async function handlePayload(payload) {
              verificationPayloadInput.value = payload;
              form.submit();

              // Disable the buttons to prevent multiple submissions
              uploadSlip.disabled = true;
              scanSlip.disabled = true;
            }
            uploadSlip.addEventListener("click", async () => {
              const image = await obtainImage();
              handleImage(image);
            });
            async function scanQr() {
              return new Promise((resolve, reject) => {
                const w = window.open(
                  "https://scan-qr-code.vercel.app/?action=scan&fit=cover&post=opener",
                  "_blank",
                  "width=320,height=320,toolbar=no"
                );
                const onMessage = (e) => {
                  if (e.source === w && e.data.text) {
                    w.close();
                    removeEventListener("message", onMessage);
                    resolve(e.data.text);
                  }
                };
                addEventListener("message", onMessage);
              });
            }
            scanSlip.addEventListener("click", async () => {
              handlePayload(await scanQr());
            });
          </script>`;
      };
      const renderStatus = () => {
        let statusAlert: Html = "";
        if (bill.status === "verificationPending") {
          statusAlert = html`<div class="alert alert-info">
            Your payment information is being verified. You can now close this
            page.
          </div>`;
        }
        if (bill.status === "verificationFailed") {
          statusAlert = html`<div class="alert alert-danger">
            Your payment information could not be verified. Contact Riffy to
            resolve this issue.
          </div>`;
        }
        if (bill.status === "paid") {
          statusAlert = html`<div class="alert alert-success">
              Your payment has been verified: You sent me ฿${bill.amount}.
              Thanks again!
            </div>
            ${billDetails}

            <div class="text-muted mt-5">
              <small>
                <a
                  href="https://www.youtube.com/watch?v=6jlH0t67IFs"
                  class="text-muted"
                  style="text-decoration: none"
                  >Curious how this works?<br />Check out my YouTube video about
                  Slipbox.</a
                >
              </small>
            </div> `;
        }
        return html` <p>
            Hello, <strong class="text-name">${bill.payer}</strong>.
          </p>
          <p>
            I received your payment information for
            <strong class="text-name">${bill.description}</strong>. Thanks!
          </p>
          ${statusAlert}`;
      };
      return pageResponse(
        "Bill",
        bill.status === "unpaid" ? unpaid() : renderStatus()
      );
    },
    {
      params: t.Object({
        billId: t.String(),
      }),
    }
  )
  .post(
    "/bills/:billId",
    async ({ params: { billId }, body: { verificationPayload }, error }) => {
      let bill = await loadBill(billId);
      if (!bill) {
        return error(404, "Bill not found");
      }
      if (bill.status !== "unpaid") {
        return error(400, "Bill is not unpaid");
      }
      if (!validatePayload(verificationPayload)) {
        return error(400, "Invalid slip data received");
      }
      const verifyAndRedirect = async () => {
        bill = await updateBill(bill!, {
          status: "verificationPending",
          verificationPayload,
          submittedAt: Math.floor(Date.now() / 1000),
        });
        bill = await verifyBill(bill);
        return html`
          <script>
            document.getElementById("progress-alert").textContent =
              "Redirecting…";
            window.location.href = "/bills/${billId}";
          </script>
        `;
      };
      return pageResponse(
        "Verifying payment",
        html`
          <div class="text-center mb-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div class="alert alert-info">
            <span id="progress-alert"
              >Now verifying your payment… Please wait!</span
            >
          </div>
          ${verifyAndRedirect()}
        `
      );
    },
    {
      params: t.Object({
        billId: t.String(),
      }),
      body: t.Object({
        verificationPayload: t.String(),
      }),
    }
  );
