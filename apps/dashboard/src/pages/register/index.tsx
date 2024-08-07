import { GetServerSideProps } from "next";
import { Seller, UserType } from "next-auth";
import { getSession, signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/legacy/image";
import { useEffect, useState } from "react";
import { Button, Card, Col, Form, InputGroup, Row } from "react-bootstrap";
import { FaDoorClosed } from "react-icons/fa";
import Stripe from "stripe";
import { Plans } from "../../components/Plans";
import { WMToast, WMToastProps } from "../../components/WMToast";
import useLocalStorage from "../../hooks/useLocalStorage";
import { stripe } from "../../payment/stripe";
import { Plan, SelectedPlan, SystemProduct } from "../../types/plan";
import { apiRoute, currency, getPlanProperty, getProductAndPrice, mask } from "../../utils/wm-functions";

interface RegisterProps {
  sellers: Seller[];
  plans: Plan[];
  startValue: number;
  printValue: number;
  products: SystemProduct[]
}

export default function Register({
  sellers,
  plans,
  products
  // startValue: menuValue,
  // printValue: printServiceValue,
}: RegisterProps) {
  const [cart, setCart] = useState<{ id: number, price_id: string, value: number, quantity: number, name: string, service: string, category?: string }[]>([]);
  const [emailInvalid, setEmailInvalid] = useState<boolean>();
  const [printer, setPrinter] = useState({
    value: 0,
    quantity: 1
  });

  const [secretNumberInvalid, setSecretNumberInvalid] = useState<{
    type: string;
    valid: boolean;
  }>();
  const [currentSeller, setCurrentSeller] = useLocalStorage("currentSeller", localStorage.getItem("currentSeller") ?? 1);
  const [gateway, setGateway] = useState<string | undefined>();
  const [newUser, setNewUser] = useState<Partial<UserType>>({
    name: "",
    secretNumber: "",
    email: "",
    whatsapp: "",
    password: "",
    sellerId: Number(currentSeller ?? 1),
    controls: {
      bilhetParcelament: false,
      disableInvoice: false,
      period: "monthly",
      salePrint: false,
      salePrintQTD: 1,
      serviceStart: false,
      currency: "brl"
    },
    plans: [],
    planId: 4,
  });
  const [installments, setInstallments] = useState<number>(1);

  const [showToast, setShowToast] = useState(false);
  const [toast, setToast] = useState<WMToastProps>({});

  const productPrinter = products.find(pr => pr.service === 'printer');
  const productMenu = products.find(pr => pr.service === 'menu');
  const handleShowToast = (toastProps: WMToastProps) => {
    toastProps.title ? toastProps.title : "";
    toastProps.content ? toastProps.content : "";
    setToast(toastProps);
    setShowToast(true);
  };

  const handleCreateNewUser = async () => {
    if (!gateway && newUser.controls?.disableInvoice) {
      handleShowToast({
        title: 'Criação',
        content: 'Selecione o gateway de pagamento para o usuário antes de continuar.'
      });
      return
    }

    try {
      const { data } = await apiRoute("/register", undefined, "POST", {
        ...newUser,
        gateway: newUser.controls?.disableInvoice ? gateway : undefined,
        cart,
        installments
      });
      signIn("credentials", data);
    } catch (error: any) {
      if (Array.isArray(error.response.data)) {
        error.response.data.forEach((erro: any) => {
          switch (erro.field) {
            case "name":
              handleShowToast({
                type: "erro",
                content: erro.message,
                title: "Nome",
              });
              break;
            case "secretNumber":
              handleShowToast({
                type: "erro",
                content: erro.message,
                title: "CPF/CNPJ",
              });
              break;
            case "email":
              handleShowToast({
                type: "erro",
                content: erro.message,
                title: "Email",
              });
              break;
            case "whatsapp":
              handleShowToast({
                type: "erro",
                content: erro.message,
                title: "Whatsapp",
              });
              break;
            case "password":
              handleShowToast({
                type: "erro",
                content: erro.message,
                title: "Senha",
              });
              break;
            default:
              handleShowToast({ type: "erro" });
              break;
          }
        });
      }
    }
  };

  const getTotal = (divided: boolean = true) => {
    const value = cart.reduce((acc, item) => (acc + (item.quantity * item.value)), 0);
    return divided ? (value / installments) : value
  }

  const getBilhetParcelament = ({
    invoiceInstallments = installments,
    serviceStart = newUser.controls?.serviceStart,
    period = newUser.controls?.period,
    salePrint = newUser.controls?.salePrint
  }: any = {}) => {
    return serviceStart && salePrint && period === "yearly" && invoiceInstallments >= 2
  }

  useEffect(() => {
    const printer = products.find(prod => prod.service === 'printer');
    const menu = products.find(prod => prod.service === 'menu');

    if (printer) {
      const { price } = getProductAndPrice({ product: printer });
      if (price) {
        const value = price.currencies[newUser.controls?.currency ?? "brl"].unit_amount ?? 0;

        setPrinter(oldPrint => {
          return {
            value: value / 100,
            quantity: oldPrint.quantity
          }
        });
      }
    }

    if (menu) {
      const { price } = getProductAndPrice({ product: printer });

      if (price) {
        const value = price.currencies[newUser.controls?.currency ?? "brl"].unit_amount ?? 0;
      }

    }

    setCart(oldCart => {
      return oldCart.map(item => {
        if (item.service === 'plan') {
          const plan = plans.find(pl => pl.id === item.id);
        } else {
          const product = products.find(prod => prod.id === item.id);
          if (product) {
            const { price } = getProductAndPrice({ product, priceId: item.price_id });

            if (price) {
              const value = price.currencies[newUser.controls?.currency ?? "brl"].unit_amount ?? 0;
              item.value = value / 100;
            }
          }
        }

        return item
      })
    })
  }, [products, newUser.controls?.currency]);

  return (
    <>
      <Head>
        <title>Cadastrar Cliente - WhatsMenu</title>
      </Head>
      <div className="d-flex">
        <Card className="mx-auto mt-5 w-75 text-center">
          <Card.Header>
            <Image
              src="/images/logoWhatsVertical.png"
              height={80}
              width={140}
              alt="Logo"
            />
            <h4 className="mt-4">Cadastrar Cliente</h4>
          </Card.Header>
          <Card.Body>
            <div className="col-md-7 mx-auto">
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>Nome Completo</b>
                  </Form.Label>
                  <Form.Control
                    placeholder="Nome do dono do estabelecimento"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                  />
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>CPF/CNPJ</b>
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      placeholder="CPF ou CNPJ"
                      value={newUser.secretNumber}
                      isInvalid={secretNumberInvalid && !secretNumberInvalid?.valid}
                      isValid={secretNumberInvalid?.valid}
                      onChange={(e) => {
                        const isValid = mask(e, "cpf/cnpj");
                        setSecretNumberInvalid(isValid);
                        setNewUser({
                          ...newUser,
                          secretNumber: e.currentTarget.value,
                        });
                      }}
                      maxLength={18}
                    />
                    <Form.Control.Feedback
                      tooltip
                      type="invalid"
                      style={{ zIndex: 0 }}
                      className="mt-2"
                    >
                      {secretNumberInvalid?.type} inválido
                    </Form.Control.Feedback>
                  </div>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>Email</b>
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="email"
                      placeholder="Email do dono do estabelecimento"
                      value={newUser.email}
                      isInvalid={emailInvalid}
                      isValid={emailInvalid !== undefined && !emailInvalid}
                      onChange={(e) => {
                        e.target.value === "" ? setEmailInvalid(undefined) : setEmailInvalid(mask(e, "email").valid)
                        setNewUser({ ...newUser, email: e.target.value });
                      }}
                    />
                    <Form.Control.Feedback
                      tooltip
                      type="invalid"
                      style={{ zIndex: 0 }}
                      className="mt-2"
                    >
                      Email inválido
                    </Form.Control.Feedback>
                  </div>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>WhatsApp (com DDD)</b>
                  </Form.Label>
                  <Form.Control
                    placeholder="Celular do dono do estabelecimento"
                    value={newUser.whatsapp}
                    autoComplete="off"
                    id="whatsRegister"
                    onChange={(e) => {
                      mask(e, "tel");
                      setNewUser({ ...newUser, whatsapp: e.target.value });
                    }}
                  />
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>Senha</b>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="new-password"
                    placeholder="Cadastre uma Senha"
                    value={newUser.password}
                    id="passwordRegister"
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </Col>
              </Row>
              <Form.Label>
                <b>Vendedor</b>
              </Form.Label>
              <Form.Select
                defaultValue={currentSeller ?? newUser.sellerId}
                onChange={(e) => {
                  setNewUser({ ...newUser, sellerId: Number(e.target.value) });
                  setCurrentSeller(Number(e.target.value));
                }}
              >
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </Form.Select>
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>País</b>
                  </Form.Label>
                  <Form.Select
                    defaultValue={newUser.controls?.currency}
                    onChange={(e) => {
                      if (newUser.controls) {
                        setNewUser(old => {
                          return {
                            ...newUser,
                            plans: [],
                            controls: {
                              ...newUser.controls,
                              currency: e.target.value
                            },
                          }
                        });
                        const selectStartValue = document.getElementById('select_start_value') as HTMLSelectElement;
                        if (selectStartValue && productMenu) {
                          selectStartValue.value = productMenu.default_price;
                        }
                        const selectPrinter = document.getElementById('printer_value') as HTMLSelectElement;
                        if (selectPrinter && productPrinter) {
                          selectPrinter.value = productPrinter.default_price;
                        }
                      }
                    }}>
                    <option value="brl">Brasil</option>
                    <option value="usd">Estados Unidos</option>
                  </Form.Select>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>Período</b>
                  </Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      if (newUser.controls) {
                        setNewUser({
                          ...newUser,
                          controls: {
                            ...newUser.controls,
                            period: e.target.value as any,
                            bilhetParcelament: getBilhetParcelament({period: e.target.value})
                          },
                        });
                      }
                    }}
                  >
                    <option value="monthly">Mensal</option>
                    <option value="semester">Semestral</option>
                    <option value="yearly">Anual</option>
                  </Form.Select>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col className="d-flex gap-2 flex-row-reverse justify-content-end mt-4">
                  <Form.Label htmlFor="cardMensality">
                    Mensalidade no cartão
                  </Form.Label>
                  <Form.Check
                    id="cardMensality"
                    checked={newUser.controls?.disableInvoice ?? false}
                    onChange={(e) => {
                      if (newUser.controls) {
                        setNewUser({
                          ...newUser,
                          controls: {
                            ...newUser.controls,
                            disableInvoice: e.target.checked,
                            bilhetParcelament: !e.target.checked && getBilhetParcelament()
                          },
                        });
                      }
                    }}
                  />
                </Col>
              </Row>
              <Row className="d-flex gap-2 ">
                <Col className="d-flex flex-row-reverse gap-2 justify-content-end">
                  <Form.Label htmlFor="registerService">
                    Adicionar serviço de cadastro
                  </Form.Label>
                  <Form.Check
                    id="registerService"
                    checked={newUser.controls?.serviceStart ?? false}
                    onChange={(e) => {
                      if (newUser.controls) {
                        setNewUser({
                          ...newUser,
                          controls: {
                            ...newUser.controls,
                            serviceStart: e.target.checked,
                            bilhetParcelament: getBilhetParcelament({serviceStart: e.target.checked})
                          },
                        });
                        if (productMenu) {
                          const price = productMenu.operations.prices.find(pr => pr.id === productMenu.default_price);
                          if (price) {
                            if (e.target.checked) {
                              setCart([
                                ...cart,
                                {
                                  id: productMenu.id,
                                  price_id: price.id,
                                  name: productMenu.name,
                                  service: 'menu',
                                  value: price.currencies[newUser.controls?.currency ?? 'brl'].unit_amount / 100,
                                  quantity: 1
                                },
                              ]);
                            } else {
                              setCart(cart.filter(pr => pr.service !== 'menu'));
                              const select = document.getElementById('select_start_value') as HTMLSelectElement;
                              if (select) {
                                select.value = productMenu.default_price;
                              }
                            }

                          }
                        }
                      }
                    }}
                  />
                </Col>
                <Col sm={4}>
                  {/* <span style={{ textDecoration: !newUser.controls?.serviceStart ? 'line-through' : '' }}>{currency({ value: startValue, currency: newUser.controls?.currency })}</span> */}
                  <Form.Select
                    id="select_start_value"
                    defaultValue={productMenu?.default_price}
                    disabled={!newUser.controls?.serviceStart}
                    onChange={(e) => {
                      if (productMenu) {
                        setCart(oldCart => {
                          return oldCart.map(item => {
                            if (item.service === 'menu') {
                              const { price } = getProductAndPrice({ product: productMenu, priceId: e.target.value });
                              if (price) {
                                const value = price.currencies[newUser.controls?.currency ?? "brl"].unit_amount ?? 0;
                                item.price_id = price.id;
                                item.value = value / 100;
                              }
                            }

                            return item;
                          })
                        })
                      }
                    }}
                  >
                    {
                      productMenu?.operations.prices?.map(pr => {
                        if(pr.status === false){
                          return null
                        }
                        const currencyM = pr.currencies[newUser.controls?.currency ?? 'brl'];

                        return <option key={pr.id} value={pr.id} data-currency-value={currencyM.unit_amount}>{currency({ value: (currencyM.unit_amount / 100), currency: newUser.controls?.currency })}</option>
                      })
                    }
                  </Form.Select>
                </Col>
              </Row>
              <Row>
                <Col sm>
                  <div className="d-flex gap-2 flex-row-reverse justify-content-end">
                    <Form.Label htmlFor="withPrinter" className="mb-0">
                      Com impressora
                    </Form.Label>
                    <Form.Check
                      id="withPrinter"
                      checked={newUser.controls?.salePrint ?? false}
                      onChange={(e) => {
                        if (newUser.controls) {
                          setNewUser({
                            ...newUser,
                            controls: {
                              ...newUser.controls,
                              salePrint: e.target.checked,
                              salePrintQTD: 1,
                              bilhetParcelament: getBilhetParcelament({salePrint: e.target.checked})
                            },
                          });

                          if (productPrinter) {
                            const price = productPrinter.operations.prices.find(pr => pr.id === productPrinter.default_price);
                            if (price) {
                              if (e.target.checked) {
                                setCart([
                                  {
                                    id: productPrinter.id,
                                    price_id: price.id,
                                    name: productPrinter.name,
                                    service: 'printer',
                                    value: price.currencies[newUser.controls?.currency ?? 'brl'].unit_amount / 100,
                                    quantity: 1
                                  },
                                  ...cart
                                ])
                              } else {
                                setCart(old => {
                                  return old.filter(item => item.service !== 'printer');
                                })
                                const select = document.getElementById('printer_value') as HTMLSelectElement;
                                if (select && productPrinter) {
                                  select.value = productPrinter.default_price;
                                  const { price } = getProductAndPrice({ product: productPrinter });
                                  if (price) {
                                    const value = price.currencies[newUser.controls?.currency ?? "brl"].unit_amount ?? 0;
                                    setPrinter({
                                      quantity: 1,
                                      value: value / 100
                                    })
                                  }
                                }
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <InputGroup>
                    <InputGroup.Text>Quant.</InputGroup.Text>
                    <Form.Control
                      type="number"
                      disabled={!newUser.controls?.salePrint ?? false}
                      value={newUser.controls?.salePrintQTD ?? 1}
                      onChange={(e) => {
                        if (newUser.controls) {
                          setNewUser({
                            ...newUser,
                            controls: {
                              ...newUser.controls,
                              salePrintQTD: Number(e.target.value),
                            },
                          });
                          setPrinter({
                            ...printer,
                            quantity: Number(e.target.value)
                          });

                          setCart(oldCart => {
                            return oldCart.map(item => {
                              if (item.service === 'printer') {
                                item.quantity = Number(e.target.value)
                              }
                              return item;
                            })
                          })
                        }
                      }}
                      min={1}
                    />
                    <InputGroup.Text>{currency({ value: (printer.value * printer.quantity), currency: newUser.controls?.currency })}</InputGroup.Text>
                  </InputGroup>
                </Col>
                <Col
                  sm={4}
                  className={`d-flex align-items-end justify-content-center`}
                >
                  {/* <span style={{ textDecoration: !newUser.controls?.salePrint ? 'line-through' : '' }}>{
                    currency({ value: (printer.value * printer.quantity), currency: newUser.controls?.currency })
                  }</span> */}
                  <Form.Select
                    id={"printer_value"}
                    defaultValue={productPrinter?.default_price}
                    disabled={!newUser.controls?.salePrint}
                    onChange={(e) => {
                      if (productPrinter) {
                        setCart(oldCart => {
                          return oldCart.map(item => {
                            if (item.service === 'printer') {
                              const { price } = getProductAndPrice({ product: productPrinter, priceId: e.target.value });
                              if (price) {
                                const value = price.currencies[newUser.controls?.currency ?? "brl"].unit_amount ?? 0;
                                item.price_id = price.id;
                                item.value = value / 100;

                                setPrinter({
                                  ...printer,
                                  value: value / 100
                                })
                              }


                            }

                            return item;
                          })
                        });

                      }
                    }}
                  >
                    {
                      productPrinter?.operations.prices?.map(pr => {
                        const currencyM = pr.currencies[newUser.controls?.currency ?? 'brl'];

                        return <option key={pr.id} value={pr.id} data-currency-value={currencyM.unit_amount}>{currency({ value: (currencyM.unit_amount / 100), currency: newUser.controls?.currency })}</option>
                      })
                    }
                  </Form.Select>
                </Col>
              </Row>
              <br />
              {(newUser.controls?.disableInvoice || (newUser.controls?.period === "yearly")) && (
                <Row>
                  <Col md className="text-center">
                    <Form.Label >
                      <b>Quantidade de Parcelas</b>
                    </Form.Label>
                    <Form.Select value={installments} onChange={(e) => {
                      const invoiceInstallments = Number(e.target.value);
                      if (newUser.controls) {
                        setNewUser({
                          ...newUser,
                          controls: {
                            ...newUser.controls,
                            bilhetParcelament: getBilhetParcelament({ invoiceInstallments })
                          }
                        })
                      }
                      setInstallments(invoiceInstallments)
                    }}>
                      {
                        Array(newUser.controls.disableInvoice ? 12 : 3).fill(null).map((item, index) => {
                          const indexValue = (index + 1);
                          return <option key={index} selected={indexValue === 1} value={indexValue}>{indexValue}</option>
                        })
                      }
                    </Form.Select>
                  </Col>
                </Row>
              )}
              <Row className="mt-2">
                <Col>
                  <Form.Label>
                    <b>Gateway de Pagamento</b>
                  </Form.Label>
                  <Form.Select
                    disabled={!newUser.controls?.disableInvoice}
                    title={!newUser.controls?.disableInvoice ? 'Ative mensalidade no cartão para habilitar o gateway' : ''}
                    onChange={(e) => {
                      setGateway(e.target.value);
                    }}
                  >
                    <option selected disabled >Selecione uma opção</option>
                    {/* <option value="stripe">Stripe</option> */}
                    <option value="pagarme">Pagar.me</option>
                  </Form.Select>
                </Col>
              </Row>
              <Plans
                type="create"
                plans={plans}
                period={newUser.controls?.period}
                user={newUser}
                setUser={setNewUser}
                setCart={setCart}
                products={products}
              />
              <br />
              <h4 className="text-start fw-bold">Carrinho</h4>
              <hr />
              {
                cart.map(item => {
                  return <Row key={item.name}>
                    <Col sm={7} className="text-start">
                      <span>{item.quantity}X | {item.name}</span>
                    </Col>
                    <Col className="text-end">
                      <span>{currency({ value: (item.value * item.quantity), currency: newUser.controls?.currency })}</span>
                    </Col>
                  </Row>
                })
              }
              <hr />
              <div className="d-flex justify-content-center align-items-center gap-2 flex-column">
                <span className="border-bottom ">
                  <b>Total: </b>
                  {installments}X {currency({
                    value: getTotal(), currency: newUser.controls?.currency
                  })}
                </span>
                {
                  installments !== 1 &&
                  <span>
                    {
                      currency({
                        value: getTotal(false), currency: newUser.controls?.currency
                      })
                    }
                  </span>
                }
              </div>
              <br />
              <p className="fs-8 mt-3">
                Ao prosseguir, aceito que o WhatsMenu entre em contato comigo
                por telefone, e-mail ou WhatsApp (incluindo mensagens
                automáticas para fins comerciais).
              </p>
            </div>
            <Button
              variant="success"
              className="align-middle mx-auto"
              onClick={handleCreateNewUser}
              disabled={emailInvalid || !secretNumberInvalid?.valid}
            >
              Começar Cadastro
            </Button>
          </Card.Body>
        </Card>
      </div>
      <section className="modals">
        <WMToast
          position={toast.position}
          flexPositionX={toast.flexPositionX}
          flexPositionY={toast.flexPositionY}
          title={toast.title}
          content={toast.content}
          show={showToast}
          setShow={setShowToast}
          type={toast.type}
          size={toast.size}
        />
      </section>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })


  const { data } = await apiRoute("/register", undefined);
  const { data: products } = await apiRoute("/api/v2/systemProducts", session);

  const types = ["adm", "seller", "support", "test", "manager"];

  if(session && session.user?.controls?.type && !types.includes(session.user.controls.type)){
    return {
      props:{},
      redirect: {
        destination: "/dashboard/requests"
      }
    }
  }

  return {
    props: { ...data, products },
  };
};
