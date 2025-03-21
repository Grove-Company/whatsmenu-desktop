import { describe, expect, it, vi } from "vitest";
import { ProfileType } from "../src/@types/profile";
import { whatsmenu_api_v3 } from "../src/lib/axios";
import { getMerchantApi, polling } from "../src/services/ifood";

import axios from "axios";
import { MerchantType } from "../src/@types/merchant";
import merchantMock from "./mocks/merchant.mock.json";
import profileMock from "./mocks/profile.mock.json";
import pollingMock from "./mocks/polling.mock.json";

const profile = profileMock as unknown as ProfileType;
const merchant = merchantMock as unknown as MerchantType;
const pollingData = pollingMock as unknown as any[];

describe("IFood Service", () => {
  const whatsmenu_api_v3_spy = vi.spyOn(whatsmenu_api_v3, "get");

  describe("getMerchantApi", () => {
    it("Não deve ser possível buscar a loja ifood sem um perfil", async () => {
      try {
        await getMerchantApi({ profile: undefined as ProfileType });
      } catch (error) {
        expect(error).instanceOf(Error);
        expect(error).toHaveProperty("message", "Perfil não encontrado!");
      } finally {
        whatsmenu_api_v3_spy.mockReset();
      }
    });

    it("Deve ser possível buscar a loja ifood atribuida a um perfil", async () => {
      try {
        whatsmenu_api_v3_spy.mockResolvedValue({ data: {} });
        await getMerchantApi({ profile });
        expect(whatsmenu_api_v3_spy).toHaveBeenCalledWith(
          `/ifood/merchant?slug=${profile.slug}`,
        );
      } catch (error) {
        throw error;
      } finally {
        whatsmenu_api_v3_spy.mockReset();
      }
    });
  });

  describe("polling", () => {
    it("Não deve ser possível fazer polling sem um perfil", async () => {
      try {
        await polling({
          profile: undefined as ProfileType,
          merchant: {} as MerchantType,
        });
      } catch (error) {
        expect(error).instanceOf(Error);
        expect(error).toHaveProperty("message", "Perfil não encontrado!");
      }
    });
    it("Não deve ser possível fazer polling sem uma loja ifood", async () => {
      try {
        await polling({
          profile: {} as ProfileType,
          merchant: undefined as MerchantType,
        });
      } catch (error) {
        expect(error).instanceOf(Error);
        expect(error).toHaveProperty("message", "Loja ifood não encontrada!");
      }
    });

    it("Deve ser possível fazer polling", async () => {
      const axiosGetSpy = vi
        .spyOn(axios, "get")
        .mockResolvedValue({ data: pollingData });
      const axiosPostSpy = vi.spyOn(axios, "post").mockResolvedValue({});
      const whatsmenu_api_v3_spy = vi
        .spyOn(whatsmenu_api_v3, "post")
        .mockResolvedValue({ data: { orders: [] } });
      try {
        await polling({
          profile,
          merchant,
        });
        expect(axiosGetSpy).toHaveBeenCalledWith(
          "https://merchant-api.ifood.com.br/events/v1.0/events:polling?groups=ORDER_STATUS",
          {
            headers: {
              Authorization: `Bearer ${merchant.token}`,
              "x-polling-merchants": `${merchant.merchantId}`,
            },
          },
        );
        expect(whatsmenu_api_v3_spy).toHaveBeenCalledWith("ifood/polling", {
          pollingData,
          token: merchant.token,
        });
        expect(axiosPostSpy).toHaveBeenCalledWith(
          "https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment",
          pollingData,
          {
            headers: {
              Authorization: `Bearer ${merchant.token}`,
            },
          },
        );
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        axiosGetSpy.mockRestore();
      }
    });
  });
});
