import { GristDocAPI } from "@rayriffy/grist-api";

export const grist = new GristDocAPI(Bun.env["GRIST_DOC_URL"]!, {
  headers: {
    "cf-access-client-id": Bun.env["GRIST_CF_ID"]!,
    "cf-access-client-secret": Bun.env["GRIST_CF_SECRET"]!,
  },
});
