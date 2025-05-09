import axios from "axios";
import { MerchantType } from "../@types/merchant";
import { ProfileType } from "../@types/profile";
import { whatsmenu_api_v3 } from "../lib/axios";
import { store } from "../main/store";
import { io } from "../services/ws_integration";

let pollingData;

export const getMerchantApi = async ({
  profile,
}: {
  profile: ProfileType | null;
}) => {
  try {
    if (!profile) {
      throw new Error("Perfil não encontrado!");
    }
    const { data } = await whatsmenu_api_v3.get(
      `/ifood/merchant?slug=${profile.slug}`,
    );
    store.set("configs.merchant", data);
  } catch (error) {
    throw error;
  }
};

export const polling = async ({
  merchant,
  profile,
}: {
  profile: ProfileType | null;
  merchant: MerchantType | null;
}) => {
  try {
    if (!profile) {
      throw new Error("Perfil não encontrado!");
    }
    if (!merchant) {
      throw new Error("Loja ifood não encontrada!");
    }

    const { data } = await axios.get(
      "https://merchant-api.ifood.com.br/events/v1.0/events:polling",
      {
        headers: {
          Authorization: `Bearer ${merchant.token}`,
          "x-polling-merchants": `${merchant.merchantId}`,
        },
      },
    );

    pollingData = data;
    if (pollingData.length > 0) {
      const returnOrders = await whatsmenu_api_v3.post(`ifood/polling`, {
        profileId: profile.id,
        pollingData,
        token: merchant.token,
      });

      returnOrders.data.orders.forEach(async (order: any) => {
        if (order.orderStatus === "PLACED") {
          if (profile.options.integrations.ifood?.autoOrder) {
            await whatsmenu_api_v3.post(`/ifood/order/${order.orderId}/updateStatus`, {
              status: 'CONFIRMED',
            });
          }
          if (!profile.options.integrations.ifood?.autoOrder) {
            io.to(`ifood:${profile.slug}`).emit("newOrderIfood", order);
          }
        }
        if (order.orderStatus !== "PLACED") {
          io.to(`ifood:${profile.slug}`).emit("processedOrderIfood", order);
          await whatsmenu_api_v3.patch(`ifood/${order.orderId}/updatePrint`, {
            body: { print: 1, wm_id: profile.id },
          })
        }
      });
      await axios.post(
        "https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment",
        pollingData,
        {
          headers: {
            Authorization: `Bearer ${merchant?.token}`,
          },
        },
      );
    }
  } catch (error) {
    console.error("POLLING ERROR: ", error)
    throw error;
  }
};
