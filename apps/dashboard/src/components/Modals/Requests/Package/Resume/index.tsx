import { useContext, useRef, useState } from 'react'
import { Button, Col, Modal, Row, Card, Form, Dropdown } from 'react-bootstrap'
import { useReactToPrint } from 'react-to-print'
import Request, { PizzaCart, ProductCart } from '../../../../../types/request'
import { DistribuitionPackage } from '../Distribuition'
import { DateTime } from 'luxon'

import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

import {
  groupAllCarts,
  groupCart,
  handlePrintApp,
  hash,
  textPackage,
} from '../../../../../utils/wm-functions'
import { AppContext } from '../../../../../context/app.ctx'
import Cart from '../../../../../types/cart'
import CartItem from '../../../../../types/cart-item'
import { useTranslation } from 'react-i18next'
type PropsType = {
  show?: boolean
  filterSelected?: string
  carts: Cart[]
  resumeChecked: boolean
  onShowPreviousModal: () => void
  onHide: () => void
  setRequestsPersonalized: () => void
}
export function ResumePackage({
  carts,
  onShowPreviousModal,
  resumeChecked,
  filterSelected,
  setRequestsPersonalized,
  ...props
}: PropsType) {
  const { t } = useTranslation()
  const { profile, wsPrint } = useContext(AppContext)
  const [showModalDistribuicao, setShowModalDistribuicao] =
    useState<boolean>(false)
  const [groupItems, setGroupItems] = useState<boolean>(
    profile.options.print.groupItems
  )
  const [boldPrinter, setBoldPrinter] = useState<string>('')
  const [daySelected, setDaySelected] = useState<string>(
    DateTime.local().toFormat(`${t('date_format')}`)
  )
  //To Printer
  const requestsFiltereds = carts.filter((cart) => {
    if (resumeChecked) {
      return cart
    } else {
      return cart.date().onlyDate === daySelected && cart.status !== 'canceled'
    }
  })

  const componentRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Agua na boca',
    copyStyles: false,
    pageStyle: `
        *{
          width: 80mm !important;
          box-sizing: border-box;
          font-weight: ${boldPrinter}
        }

        p{
          margin: 1px 0;
        }
        
        div.header-resume {
          display: none
        }

        .detail-printer{
          margin-bottom: 30px;
        }

        div.col-delivery{
          min-height: 0 !important;
        }

        .col-delivery-title{
          padding-top: 1rem;
          border-top: 1px dashed black;
          display: block;
        }

        .col-local-title{
          padding-top: 1rem;
          border-top: 1px dashed black;
          display: block;
        }

        h4{
          font-size: 1.2rem;
          margin: 5px;
        }

        .cart-container, .cartPizza-container{
          padding-bottom: 10px;
          margin-bottom: 10px;
        }

        .cartPizza-container p{
          margin: 0 !important;
        }

        .product-name{
          margin: 0 0 5px 0;
        }

        .complement-namem{
          margin: 0 15px;
        }

        .complement-item, .flavor-name{
          padding: 0 25px !important;
        }

        .noPrint{
          display: none !important
        }
      `,
  })

  const resetInputs = (value: boolean) => {
    const inputs = Array.from(
      document.querySelectorAll('input[data-type=package]')
    ) as HTMLInputElement[]

    inputs.forEach((input) => {
      input.checked = value
    })
  }

  const $distribuitionModal = (
    <DistribuitionPackage
      show={showModalDistribuicao}
      onReturnModal={() => {
        setShowModalDistribuicao(false)
        onShowPreviousModal()
      }}
      onHide={() => {
        setShowModalDistribuicao(false)
      }}
      carts={carts}
    />
  )

  const { cartDelivery, cartDeliveryLocal, cartPizza, cartPizzaLocal } =
    groupAllCarts(requestsFiltereds)

  const $cart = (cartResume: CartItem[] = [], cartPizzaLength: number) => {
    return cartResume?.map((prod, indexProd, arrProd) => {
      return (
        <div
          className={`fs-7 cart-container fw-${boldPrinter}`}
          key={`cart-${prod.id}-${hash(10)}`}
          style={{
            borderBottom:
              indexProd < arrProd.length - 1 || cartPizzaLength
                ? '1px dashed '
                : '',
          }}
        >
          <div className="my-2">
            <p className="product-name m-0">
              {prod.quantity}X | {prod.name}
            </p>
            {/* <p className="m-0 ">
                (
                {currency(prod.value)}
                )
              </p> */}
            <div className="my-1 ps-2">
              {prod.details.complements?.map((complement, indexCompl) => {
                return (
                  <div
                    className="m-0 p-0"
                    key={`${complement.id}-${complement.created_at}-${indexCompl}`}
                  >
                    <p className="fw-bold complement-name m-0">
                      {complement.name}
                    </p>
                    {complement.itens?.map((item, indexCompl2) => {
                      return (
                        <Row
                          key={`${complement.id}-${complement.updated_at}-${indexCompl2}`}
                          className="complement-item"
                        >
                          <Col sm="8">
                            <div className="mt-1 ps-3">
                              <span>
                                <span className="fw-bold">
                                  {item.quantity}X{' '}
                                </span>
                                {item.name}
                              </span>
                            </div>
                          </Col>
                          {/* <Col sm="4" className="px-0">
                                (
                                {currency(item.value)}
                                )
                              </Col> */}
                        </Row>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* <p className="m-0 mt-2  text-center">
                (
                {currency(Request.calcValueProduct(prod, type))}
                )
              </p> */}
          </div>
        </div>
      )
    })
  }

  const $cartPizza = (cartPizza: CartItem[] = []) => {
    return cartPizza?.map((pizza, indexPizza, arrPizza) => {
      return (
        <div
          className={`fs-7 cartPizza-container fw-${boldPrinter}`}
          key={`cart-pizza-${pizza.id}-${indexPizza}`}
          style={{
            borderBottom: indexPizza < arrPizza.length - 1 ? '1px dashed' : '',
          }}
        >
          <div className="w-100 py-1">
            <p className="text-uppercase m-0 ">
              {`${pizza.quantity}x | ${pizza.name}
                }`}
            </p>

            {/* <p className="m-0">
                {`(${currency(pizza.value)})`}
              </p> */}

            <div className="flavor-name my-1">
              {pizza.details.flavors?.map((flavor, indexFlavor) => {
                return (
                  <p key={`flavors-${flavor.code}`} className="m-0 ps-2">
                    <span className="ps-3">{flavor.name}</span>
                  </p>
                )
              })}
            </div>

            {pizza.details.implementations?.map((implementation, indexImpl) => {
              return (
                <div
                  key={`implementation-${implementation.code}-${indexImpl}`}
                  className="fw-bold fs-8 w-100` m-0 my-1"
                >
                  <Row className="w-100">
                    <Col sm="12">{implementation.name}</Col>
                    {/* <Col sm="4">
                        (
                        {currency(implementation.value)}
                        )
                      </Col> */}
                  </Row>
                </div>
              )
            })}

            {pizza.obs ? (
              <p className="m-0">
                {' '}
                <span className="fw-bold">Obs:</span> {pizza.obs}{' '}
              </p>
            ) : null}

            {/* <p className="m-0 my-1 text-center">
                {`(${currency(pizza.value)}`}
              </p> */}
          </div>
        </div>
      )
    })
  }

  const $deliveryAndLocal = (
    <Card className="card-content position-relative">
      <Card.Header className="d-none d-md-block noPrint my-0 py-0">
        <Row>
          <Col sm className="border-end py-1 text-center">
            <h5
              className={` fs-7 ${!cartDelivery.length && !cartPizza.length ? 'noPrint' : ''}`}
            >
              {t('deliver')}
            </h5>
          </Col>
          {/* <div className="vr"></div> */}
          <Col
            sm
            className={`border-start py-1 text-center ${!cartDeliveryLocal.length && !cartPizzaLocal.length ? 'noPrint' : ''}`}
          >
            <h5 className="fs-7">{t('pickup')}</h5>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body className="position-relative my-0 py-0">
        <Row>
          <Col
            sm
            className={`border-end col-delivery text-start ${!cartDelivery.length && !cartPizza.length ? 'noPrint' : ''}`}
            style={{ minHeight: '120px' }}
          >
            <div className="col-delivery-title">
              <h4 className="fs-7 d-block d-md-none border-bottom fw-bolder text-dark m-0 p-1 text-center">
                {t('deliver')}
              </h4>
            </div>
            <div>
              {$cart(
                groupCart(cartDelivery, profile.options.print.groupItems),
                cartPizza.length
              )}
              {$cartPizza(
                groupCart(cartPizza, profile.options.print.groupItems)
              )}

              {!cartDelivery.length && !cartPizza.length ? (
                <span className="fw-bold fs-7">{t('no_items_this_date')}</span>
              ) : null}
            </div>
          </Col>
          <Col
            sm
            className={`border-start col-local text-start ${!cartDeliveryLocal.length && !cartPizzaLocal.length ? 'noPrint' : ''}`}
          >
            <div className="col-local-title">
              <h4 className="fs-7 d-block d-md-none border-bottom fw-bold text-dark m-0 p-1 text-center">
                {t('pickup')}
              </h4>
            </div>
            <div>
              {$cart(
                groupCart(cartDeliveryLocal, profile.options.print.groupItems),
                cartPizzaLocal.length
              )}
              {$cartPizza(
                groupCart(cartPizzaLocal, profile.options.print.groupItems)
              )}

              {!cartDeliveryLocal.length && !cartPizzaLocal.length ? (
                <span className="fw-bold fs-7">{t('no_items_this_date')}</span>
              ) : null}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )

  const $calendar = (
    <Dropdown autoClose="outside" key="down">
      <Dropdown.Toggle variant="primary" id="dropdown-basic" className="w-100">
        {daySelected}
      </Dropdown.Toggle>
      <Dropdown.Menu className="package-calendar">
        <Dropdown.Item>
          <Calendar
            minDate={new Date()}
            tileClassName={({ date }) => {
              const dateDay = DateTime.fromJSDate(new Date(date))
              const filtereds = carts.filter((cart) => {
                return (
                  DateTime.fromJSDate(new Date(cart.packageDate)).toFormat(
                    `${t('date_format')}`
                  ) === dateDay.toFormat(`${t('date_format')}`) &&
                  cart.status !== 'canceled'
                )
              })

              if (
                dateDay.toFormat(`${t('date_format')}`) ===
                  DateTime.local().toFormat(`${t('date_format')}`) &&
                filtereds.length
              ) {
                return 'wm-green-day wm-green-day-focused'
              } else if (
                parseInt(
                  String(dateDay.diff(DateTime.local(), 'days').days)
                ) === 0 &&
                filtereds.length
              ) {
                return 'wm-orange-day wm-orange-day-focused'
              } else if (filtereds.length) {
                return 'wm-normal-day wm-normal-day-focused'
              } else {
              }

              return ''
            }}
            onClickDay={(e) => {
              setDaySelected(
                DateTime.fromJSDate(new Date(e)).toFormat(`${t('date_format')}`)
              )
            }}
          />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )

  const usedFilter = (filter: string | undefined) => {
    switch (filter) {
      case 'all':
        return t('all')
      case 'wait':
        return t('pending')
      case 'production':
        return t('marked_received')
      case 'transport':
        return 'Entregando/Retirada'
      case 'canceled':
        return t('cancelled')
      case 'shipping_delivery':
        return t('delivery')
      case 'shipping_local':
        return t('local_delivery')
    }
  }

  return (
    <>
      <Modal {...props} size="lg" centered dialogClassName="modal-to-print">
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            {t('summary_of')}{' '}
            {profile.options.package.label2
              ? `${t('your')} ${textPackage(true)}`
              : `${t('your_a')} ${textPackage(false)}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="resume-container">
            <Row>
              <Col sm>
                <Row className="justify-content-between">
                  <Col md="7" lg="8" className="d-flex mb-3 text-nowrap">
                    <span className="fw-bold fs-7">
                      {t('filter_use')}:
                      <span className="fw-normal fs-6 ms-2">
                        {usedFilter(filterSelected)}
                      </span>
                    </span>
                  </Col>
                  {/* <Col md="12" lg className="d-flex gap-2 mb-3 justify-content-center">
                    <label htmlFor="boldPrinter">
                      <Form.Check
                        className="fs-7"
                        id="boldPrinter"
                        type="switch"
                        defaultChecked={groupItems}
                        label="Negrito"
                        onClick={() => {
                          if (boldPrinter) {
                            setBoldPrinter("");
                            return;
                          }

                          setBoldPrinter("bold");
                        }}
                      />
                    </label>
                    <label htmlFor="groupItems">
                      <Form.Check
                        className="fs-7"
                        id="groupItems"
                        type="switch"
                        defaultChecked={groupItems}
                        label="Agrupar Items"
                        onClick={() => setGroupItems(!groupItems)}
                      />
                    </label>
                  </Col> */}
                </Row>
              </Col>
            </Row>
            <Row>
              <Col className="d-flex justify-content-center align-items-center">
                {resumeChecked ? (
                  <h4>
                    {t('summary_of')} {carts.length}{' '}
                    {carts.length === 1
                      ? 'Item Selecionado'
                      : 'Itens Selecionados'}
                  </h4>
                ) : (
                  <div>
                    <h6 className="m-0 p-0">{t('choose_date_summary')}</h6>
                    {$calendar}
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col ref={componentRef}>
                <Row className="fs-7 fw-bold detail-printer mt-4">
                  <Col sm className="text-center">
                    <span>
                      {t('printing')} -{' '}
                      {DateTime.local().toFormat(`${t('date_format')} HH:mm`)}
                    </span>
                  </Col>
                  {resumeChecked ? (
                    <Col sm className="text-center">
                      <span>
                        {t('selected_orders')}
                        <br />
                        {carts.map((req, index, arrReq) => (
                          <span key={req.code} className="fs-8">
                            {`wm${req.code}-${req.type}`}
                            {arrReq.length > 1 &&
                              index < arrReq.length - 1 &&
                              ', '}
                          </span>
                        ))}
                      </span>
                    </Col>
                  ) : (
                    <Col sm className="text-center">
                      <span>
                        {t('regarding')} - {daySelected}
                      </span>
                    </Col>
                  )}
                </Row>
                <Row
                  className="overflow-auto pt-3"
                  style={{ maxHeight: '200px' }}
                >
                  <Col sm>
                    {/* <h4 className="fw-bold text-center">Não há itens para resumir nesta data</h4> */}
                    {$deliveryAndLocal}
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={!carts.length}
            onClick={() => {
              props.onHide()
              setShowModalDistribuicao(true)
            }}
            variant="orange text-white"
          >
            <span className="align-middle">{t('distribution')}</span>
          </Button>
          {resumeChecked ? (
            <Button
              variant="success"
              onClick={() => {
                resetInputs(false)
                setRequestsPersonalized()
              }}
            >
              <span className="align-middle">{t('calendar_view')}</span>
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              if (profile.options.print.app) {
                wsPrint?.emit('resume', {
                  slug: profile?.slug,
                  cartDelivery,
                  cartDeliveryLocal,
                  cartPizza,
                  cartPizzaLocal,
                  datePrinter: DateTime.local().toFormat(
                    `${t('date_format')} HH:mm`
                  ),
                  reference: daySelected,
                })
              } else {
                handlePrint()
              }
            }}
            disabled={
              !cartDelivery.length &&
              !cartPizza.length &&
              !cartDelivery.length &&
              !cartPizzaLocal.length
            }
          >
            <span className="align-middle">{t('print')}</span>
          </Button>
        </Modal.Footer>
      </Modal>
      <>{$distribuitionModal}</>
    </>
  )
}
