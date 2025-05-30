import { html, type Html } from "@thai/html";
import { Elysia, t } from "elysia";
import generatePayload from "promptpay-qr";
import { loadBill, updateBill } from "./Bill";
import { pageResponse } from "./pageResponse";
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
      const promptpayPayload = generatePayload(Bun.env["PROMPTPAY_ID"]!, {
        amount: bill.amount,
      });
      const unpaid = () => {
        return html`<p>
            To pay for <strong class="text-name">${bill.description}</strong>:
          </p>
          <ol style="list-style: none; padding: 0;">
            <li>
              <p>
                <strong class="text-emphasis">Step 1 of 2:</strong>
                Please transfer
                <strong class="text-name">฿${bill.amount}</strong> to
                <strong class="text-name"
                  >${Bun.env["OWNER_ACCOUNT_NAME"]?.split("|")[0]}</strong
                >
                using the following QR code:
              </p>
              <p class="text-center">
                <span class="d-flex justify-content-center mb-1">
                  <span class="d-block p-2 bg-white rounded">
                    <qr-code text="${promptpayPayload}" size="10"></qr-code>
                  </span>
                </span>
                <small
                  class="text-muted lh-sm d-block"
                  style="text-wrap: balance"
                >
                  Scan the above QR code with your mobile banking app or take a
                  screenshot and open it in your banking app.
                </small>
              </p>
            </li>
            <li>
              <p>
                <strong class="text-emphasis">Step 2 of 2:</strong>
                Upload the slip image or scan the slip QR code after you have
                made the transfer.
              </p>
              <div class="d-flex justify-content-center flex-wrap gap-2">
                <button
                  class="btn btn-primary d-inline-flex align-items-center gap-1"
                  id="uploadSlip"
                >
                  <iconify-icon icon="mdi:upload"></iconify-icon>
                  Upload
                </button>
                <button
                  class="btn btn-primary d-inline-flex align-items-center gap-1"
                  id="scanSlip"
                >
                  <iconify-icon icon="mdi:scan-helper"></iconify-icon>
                  Scan
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
            </li>
          </ol>
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
              ({ BrowserQRCodeReader }) => {
                return new BrowserQRCodeReader();
              }
            );
            async function handleImage(image) {
              const reader = await readerPromise;
              console.log('reader ready', reader);
              console.log('image', image);
              const result = await reader.decodeFromImageElement(image);
              console.log('result', result);
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
            Your payment information could not be verified. Contact Thai to
            resolve this issue.
          </div>`;
        }
        if (bill.status === "paid") {
          statusAlert = html`<div class="alert alert-success">
            Your payment has been verified. Thanks again!
          </div>`;
        }
        return html`<p>
            I received your payment information for
            <strong>${bill.description}</strong>. Thanks!
          </p>
          ${statusAlert}`;
      };
      return pageResponse(
        "Bill",
        html`
          <p>Hello, <strong class="text-name">${bill.payer}</strong>.</p>
          ${bill.status === "unpaid" ? unpaid() : renderStatus()}
        `
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
