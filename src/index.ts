import { html } from "@thai/html";
import { Elysia, t } from "elysia";
import { GristDocAPI } from "grist-api";
import generatePayload from "promptpay-qr";
import { pageResponse } from "./pageResponse";

const grist = new GristDocAPI(Bun.env["GRIST_DOC_URL"]!);
export default new Elysia().get(
  "/bills/:billId",
  async ({ params: { billId }, error }) => {
    const found = await grist.fetchTable("Bills", { billId: [billId] });
    if (found.length !== 1) {
      return error(404, "Bill not found");
    }
    const bill = found[0] as {
      payer: string;
      description: string;
      amount: number;
    };
    const promptpayPayload = generatePayload(Bun.env["PROMPTPAY_ID"]!, {
      amount: bill.amount,
    });
    return pageResponse(
      "Bill",
      html`
        <p>Hello, <strong>${bill.payer}</strong>.</p>
        <p>To pay for <strong>${bill.description}</strong>:</p>
        <ol>
          <li>
            <p>
              Please transfer <strong>฿${bill.amount}</strong> to me using the
              following QR code:
            </p>
            <p class="text-center">
              <span style="display: inline-block;background:#fff;padding:8px">
                <qr-code text="${promptpayPayload}" size="10"></qr-code>
              </span>
              <br />
              <small class="text-muted lh-sm d-block">
                Scan the above QR code with your mobile banking app or take a
                screenshot and open it in your banking app.
              </small>
            </p>
          </li>
          <li>
            <p>Upload or scan the slip after you have made the transfer.</p>
            <div class="d-flex justify-content-center flex-wrap gap-2">
              <button
                class="btn btn-primary d-inline-flex align-items-center gap-1"
              >
                <iconify-icon icon="mdi:upload"></iconify-icon>
                Upload
              </button>
              <button
                class="btn btn-primary d-inline-flex align-items-center gap-1"
              >
                <iconify-icon icon="mdi:scan-helper"></iconify-icon>
                Scan
              </button>
            </div>
          </li>
        </ol>
      `
    );
  },
  {
    params: t.Object({
      billId: t.String(),
    }),
  }
);
