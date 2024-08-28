import { FormEvent, useCallback, useContext, useEffect, useState } from 'react'
import {
  Col,
  Row,
  Card,
  Button,
  Container,
  FormGroup,
  Form,
  InputGroup,
  Placeholder,
  Badge,
  Alert,
} from 'react-bootstrap'
import { MdAlarm, MdAttachMoney, MdPhotoLibrary } from 'react-icons/md'
import { CropModal } from '../../Modals/CropModal'
import { BsFillPhoneFill, BsTelephoneFill } from 'react-icons/bs'
import { RiComputerFill } from 'react-icons/ri'
import { AiOutlineClose } from 'react-icons/ai'
import {
  apiRoute,
  colorLuminosity,
  compareItems,
  copy,
  encryptEmoji,
  mask,
  maskedPhone,
  superNormalize,
} from '../../../utils/wm-functions'
import { AppContext } from '../../../context/app.ctx'
import { IoColorPaletteSharp } from 'react-icons/io5'
import Profile, { ProfileType } from '../../../types/profile'
import { useSession } from 'next-auth/react'
import { BiWorld } from 'react-icons/bi'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import FinPasswordModal, {
  RequestProperties,
} from '@components/Modals/FinPassword'
import { useForm } from 'react-hook-form'
import { HelpVideos } from '@components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'
import i18n from 'i18n'

interface ProfileBusinessProps {
  steps: boolean
  layout: boolean
}

export function ProfileBusiness({ steps, layout }: ProfileBusinessProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const {
    profile: profileContext,
    setProfile: setProfileContext,
    changeConfig,
    setChangeConfig,
    handleShowToast,
    currency,
  } = useContext(AppContext)
  const {
    profileState,
    handleProfileUpdate,
    toggleModal,
    dataToBeUpdated,
    handleDataToBeUpdated,
  } = useContext(PaymentMethodContext)
  const { register, setValue, getValues, watch } = useForm()

  const [profile, setProfile] = useState<Profile>(profileContext)
  const [imgUrl, setImageUrl] = useState<string>('')
  const [iconImgUrl, setIconImageUrl] = useState<string>('')
  const [imgCoverUrl, setImageSrcCoverUrl] = useState<string>('')
  const [showComputer, setShowComputer] = useState(true)
  const [DDI, setDDI] = useState(i18n.t('ddi'))
  const [whatsapp, setWhatsapp] = useState(
    profile?.whatsapp?.substring(t('ddi').length) ?? ''
  )
  //Crops States
  // const defaultCrop: Crop = { unit: '%', aspect: 768 / 307, width: 768, height: 307, x: 0, y: 0 };
  // const [imgUrlCrop, setImageSrcCrop] = useState<string>("");
  // const [cropModalShow, setCropModalShow] = useState<boolean>(false);
  const [idImage, setIdImage] = useState<string>('')
  const [typeImage, setTypeImage] = useState<string>()
  const [bgInfoColor, setBgInfoColor] = useState(profile.color ?? '#ff9900')
  const [textInfoColor, setTextInfoColor] = useState(
    colorLuminosity(profile.color).color
  )
  const [typeCrop, setTypeCrop] = useState<
    'profileCover' | 'profileLogo' | 'profileIcon'
  >('profileCover')

  const [logo, setLogo] = useState()
  const [background, setBackground] = useState()
  const [favicon, setFavicon] = useState()

  const [inputFileImage, setInputFileImage] = useState<HTMLInputElement>()
  // const [imageDimensions, setImageDimensions] = useState({
  //   width: 145,
  //   height: 145,
  // });

  const handleCreate = useCallback(async () => {
    const dataProfile = new FormData()
    Object.entries(watch()).forEach((entry) =>
      dataProfile.append(entry[0], entry[1])
    )
    if (logo) {
      dataProfile.append('logo', logo)
    }
    if (background) {
      dataProfile.append('background', background)
    }
    if (favicon) {
      dataProfile.append('favicon', favicon)
    }

    dataProfile.set('name', encryptEmoji(getValues('name') ?? profile.name))
    dataProfile.set(
      'description',
      encryptEmoji(getValues('description') ?? profile.description)
    )
    dataProfile.set(
      'whatsapp',
      DDI + superNormalize(getValues('whatsapp') ?? profile.whatsapp)
    )
    dataProfile.set('color', bgInfoColor)
    if (!watch('slug')) {
      dataProfile.set('slug', profile.slug)
    }

    try {
      const { data }: { data: ProfileType } = await apiRoute(
        '/dashboard/profile/step1',
        session,
        'POST',
        dataProfile,
        {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session?.accessToken}`,
        }
      )
      
      setProfile({ ...profile, ...data })
      setProfileContext(new Profile({ ...profile, ...data }))
      changeConfig.toRouter && changeConfig.toRouter()
      handleShowToast({
        type: 'success',
        content: '',
        title: t('profile'),
      })
    } catch (error: any) {
      if (error.response.status === 409) {
        handleShowToast({
          type: 'erro',
          title: t('profile'),
          content: error.response.data.message,
        })
      } else {
        handleShowToast({ type: 'erro', title: t('profile'), content: '' })
      }
      console.error(error)
    }
  }, [
    logo,
    background,
    favicon,
    profile,
    DDI,
    whatsapp,
    bgInfoColor,
    session,
    setProfileContext,
    changeConfig,
    handleShowToast,
  ])

  const prepareUpdateForm = () => {
    const dataProfile = new FormData()
    Object.entries(watch()).forEach((entry) =>
      dataProfile.append(entry[0], entry[1])
    )
    if (logo) {
      dataProfile.append('logo', logo)
    }
    if (background) {
      dataProfile.append('background', background)
    }
    if (favicon) {
      dataProfile.append('favicon', favicon)
    }
    dataProfile.set('name', encryptEmoji(getValues('name') ?? profile.name))
    dataProfile.set(
      'description',
      encryptEmoji(getValues('description') ?? profile.description)
    )
    dataProfile.set('whatsapp', layout ? profile.whatsapp : DDI + superNormalize(getValues('whatsapp')))
    dataProfile.set('color', bgInfoColor)
    dataProfile.set('options', JSON.stringify(profile.options))
    if (!watch('slug')) {
      dataProfile.set('slug', profile.slug)
    }
    return dataProfile
  }

  const requestProperties: RequestProperties = {
    method: profile.id ? 'PATCH' : 'POST',
    url: '/dashboard/profile/step1',
  }

  useEffect(() => {
    setProfile(new Profile(copy(profileContext) as Profile))
  }, [profileContext])

  useEffect(() => {
    if (!profile.color) {
      profile.color = '#ff9900'
    }

    setChangeConfig({
      changeState: !compareItems(profileContext, profile),
    })
  }, [profile, profileContext, setChangeConfig])

  /*   useEffect(() => {
      const { changeState, confirmSave } = changeConfig;
  
      if (changeState && confirmSave) {
        handleUpdate();
      }
    }, [changeConfig, handleUpdate]); */

  // Condicionais -> HTML
  const versionPhoneClass = !showComputer ? 'version-phone' : ''

  //Elmentos HTML
  const modalCrop = (
    <CropModal
      show={!!inputFileImage}
      quality={0.8}
      aspectInitial={typeImage === 'logo' ? true : false}
      typeCrop={typeCrop}
      onHide={() => {
        setInputFileImage(undefined)
      }}
      inputFile={inputFileImage}
      setImageBlob={(fileBlob, url) => {
        // const img = document.getElementById(idImage) as HTMLImageElement;
        // img.src = url;
        if (idImage === 'favicon-display') {
          setIconImageUrl(url)
          setFavicon(fileBlob)
        }
        if (idImage === 'background-display') {
          setImageSrcCoverUrl(url)
          setBackground(fileBlob)
        }
        if (idImage === 'logo-display') {
          setImageUrl(url)
          setLogo(fileBlob)
        }
      }}
    />
  )

  const displayPhone = (
    <Row>
      <Col sm="12" className="mx-auto mt-2">
        <div className="d-flex justify-content-center mt-2 gap-2">
          <Placeholder xs={2} />
          <Placeholder xs={2} />
          <Placeholder xs={2} />
          <Placeholder xs={2} />
          <Placeholder xs={2} />
        </div>
        <Placeholder as="div" xs={12} className="mt-2 py-3" />
      </Col>
    </Row>
  )

  const iconProfile = showComputer ? (
    <Badge
      bg="none"
      className="d-flex justify-content-between align-items-center border-1 border-bottom-0 overflow-hidden border text-start"
    >
      <div>
        <span className="d-inline-block align-middle">
          {iconImgUrl || profile.options?.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconImgUrl ? iconImgUrl : profile.options?.favicon}
              id="favicon-display"
              width={16}
              height={16}
              alt="icone"
            />
          ) : (
            <BiWorld />
          )}
        </span>
        <span className="fw-normal ms-2 align-middle text-white">
          {profile.name}
        </span>
      </div>
      <span className="ms-3 text-white">
        <AiOutlineClose color="#fff" />
      </span>
    </Badge>
  ) : (
    <Badge
      bg="none"
      className="d-flex justify-content-between align-items-center 
    overflow-hidden pb-0 text-start"
    >
      <div>
        <span className="d-inline-block align-middle">
          {/*eslint-disable-next-line @next/next/no-img-element*/}
          <img
            src={
              iconImgUrl || profile.options?.favicon || '/images/sem-foto.jpeg'
            }
            width={16}
            height={16}
            alt="icone"
          />
        </span>
        <span className="fs-8 fw-normal ms-2">{profile.name}</span>
      </div>
    </Badge>
  )

  return (
    <>
      <FinPasswordModal
        dataToBeUpdated={prepareUpdateForm()}
        request={requestProperties}
      />
      <form>
        {modalCrop}
        {/* Cria o modal se a crop propriedade for presente */}
        <section>
          {!layout ? (
            <Card>
              <Card.Header>
                <h4>{t('profile_information')}</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm>
                    <FormGroup>
                      <Form.Label className="text-upperCase fw-bold fs-7">
                        {t('store_name')} *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('enter_store_name')}
                        {...register('name', {
                          required: true,
                          onChange: (e) =>
                            setValue('slug', superNormalize(e.target.value)),
                        })}
                        defaultValue={profile.name ?? ''}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm className="mt-md-0 mt-2">
                    <FormGroup>
                      <Form.Label
                        className="fw-bold fs-7"
                        style={{ wordBreak: 'break-all' }}
                      >
                        {process.env.WHATSMENU_BASE_URL}/
                        {watch('slug') ?? profile.slug ?? ''}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('enter_slug')}
                        {...register('slug', {
                          required: true,
                          onChange: (e) =>
                            setValue('slug', superNormalize(e.target.value)),
                        })}
                        defaultValue={profile.slug ?? ''}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col sm="6" className="mt-2">
                    <FormGroup>
                      <Form.Label className="text-upperCase fw-bold fs-7">
                        {t('contact_phone_number')} *
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>+{DDI}</InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder={t('enter_contact_phone')}
                          defaultValue={whatsapp ?? ''}
                          {...register('whatsapp', {
                            required: true,
                            onChange: (e) => {
                              mask(e, 'tel')
                              setValue('whatsapp', e.currentTarget.value)
                            },
                          })}
                          // name="whatsapp"
                        />
                      </InputGroup>
                      <Form.Text as="p" className="fs-7 m-0 mt-2">
                        {t('message_phone_number_will')}
                      </Form.Text>
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col sm className="mt-md-0 mt-2">
                    <FormGroup>
                      <Form.Label className="text-upperCase fw-bold fs-7">
                        {t('description')}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        placeholder={t('enter_store_description')}
                        style={{ minHeight: '140px' }}
                        defaultValue={profile.description ?? ''}
                        {...register('description', {
                          required: true,
                          maxLength: 500,
                        })}
                      />
                      <Form.Text className="fs-7 w-100 d-block text-end">
                        {profile.description?.length
                          ? profile.description?.length
                          : 0}
                        /500 {t('characters')}
                      </Form.Text>
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col sm>
                    <FormGroup>
                      <Form.Label className="text-upperCase fw-bold fs-7">
                        {t('minimum_delivery_order')} *
                      </Form.Label>
                      <InputGroup className="mb-1">
                        <InputGroup.Text>
                          {currency({ value: 0, symbol: true })}
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="0.00"
                          defaultValue={profile.minval}
                          {...register('minval', {
                            required: true,
                            onChange: (e) => {
                              mask(e, 'currency')
                              setValue('minval', e.currentTarget.value)
                            },
                          })}
                        />
                      </InputGroup>
                      <Form.Text>
                        {t('minimum_order_excluding_delivery')}
                      </Form.Text>
                    </FormGroup>
                  </Col>
                  <Col sm>
                    <FormGroup>
                      <Form.Label className="text-upperCase fw-bold fs-7">
                        {t('minimum_order_pickup')} *
                      </Form.Label>
                      <InputGroup className="mb-1">
                        <InputGroup.Text>
                          {currency({ value: 0, symbol: true })}
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          defaultValue={profile.minvalLocal}
                          placeholder="0.00"
                          {...register('minvalLocal', {
                            required: true,
                            onChange: (e) => {
                              mask(e, 'currency')
                              setValue('minvalLocal', e.currentTarget.value)
                            },
                          })}
                        />
                      </InputGroup>
                      <Form.Text>
                        {t('minimum_order_pickup_delivery')}
                      </Form.Text>
                    </FormGroup>
                  </Col>
                </Row>
                <Row className="mt-5">
                  <Col sm="1" className="d-flex">
                    <Button
                      variant="success"
                      className="text-nowrap"
                      onClick={() =>
                        profile.id ? toggleModal(true) : handleCreate()
                      }
                    >
                      {t('save')}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <Row className="justify-content-between align-items-center">
                  <Col
                    sm="12"
                    md="8"
                    className="d-flex text-md-start gap-3 text-center"
                  >
                    <h4>{t('preview_your_store')}</h4>
                    <div className="vr"></div>
                    <HelpVideos.Trigger
                      urls={[
                        {
                          src: 'https://www.youtube.com/embed/EMS5c-fThTs',
                          title: t('preview'),
                        },
                      ]}
                    />
                  </Col>
                  {/* <Col sm>
                {window.innerWidth > 475 && (
                  <span
                    style={{ top: "-45px", cursor: "pointer" }}
                    onClick={() => setShowComputer(!showComputer)}
                  >
                    {showComputer ? (
                      <RiComputerFill size={30} />
                    ) : (
                      <BsFillPhoneFill size={30} />
                    )}
                  </span>
                )}
              </Col> */}
                  <Col sm="12" md="4" className="mt-md-0 mt-3">
                    <InputGroup className="d-flex justify-content-end">
                      <InputGroup.Text
                        className="border"
                        style={{ background: 'transparent' }}
                      >
                        {window.innerWidth > 475 && (
                          <span
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowComputer(!showComputer)}
                          >
                            {showComputer ? (
                              <RiComputerFill size={30} />
                            ) : (
                              <BsFillPhoneFill size={30} />
                            )}
                          </span>
                        )}
                      </InputGroup.Text>
                      <Button
                        variant="success"
                        className="text-nowrap"
                        onClick={() =>
                          profile.id ? toggleModal(true) : handleCreate()
                        }
                      >
                        {t('save')}
                      </Button>
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <Container
                  className={`profile-business-content position-relative pb-3 ${versionPhoneClass}`}
                >
                  <label
                    className="position-absolute ms-3"
                    style={{ top: '-25px', left: 0, cursor: 'pointer' }}
                  >
                    {iconProfile}
                    <input
                      type="file"
                      // name="favicon"
                      id="icon-image"
                      // accept="image/png, image/jpeg"
                      className="input-file-hidden"
                      onChange={(e: FormEvent) => {
                        setIdImage('favicon-display')
                        setTypeCrop('profileIcon')
                        // setImageDimensions({ width: 16, height: 16 });
                        setInputFileImage(e.target as HTMLInputElement)
                      }}
                    />
                  </label>
                  <Row>
                    <Col sm className="p-0">
                      <Row>
                        <Col className="p-0">
                          <div className="profile-business-cover position-relative">
                            {!imgCoverUrl && !profile.background && (
                              <div
                                style={{
                                  backgroundColor: profile.color,
                                  height: '60px',
                                }}
                              ></div>
                            )}
                            <label className="fs-3 profile-business-input-cover  text-white">
                              <input
                                type="file"
                                id="background-display"
                                // accept="image/png, image/jpeg"
                                onChange={(e: FormEvent) => {
                                  setIdImage('background-display')
                                  setTypeCrop('profileCover')
                                  // setImageDimensions({ width: 768, height: 307 });
                                  setInputFileImage(
                                    e.target as HTMLInputElement
                                  )
                                }}
                                className="w-100"
                              />
                              <span className="d-block profile-business-input-cover-span rounded border border-0 p-1">
                                <MdPhotoLibrary size={30} />
                                <span>{t('cover')}</span>
                              </span>
                            </label>

                            {/*eslint-disable-next-line @next/next/no-img-element*/}
                            <img
                              id="cover-image-crop"
                              src={
                                imgCoverUrl ||
                                profile.background ||
                                '/images/sem-foto.jpeg'
                              }
                              // layout="fill"
                              alt="Imagem De Capa"
                              style={{
                                width: '100%',
                                maxHeight: 190,
                                visibility:
                                  !imgCoverUrl && !profile.background
                                    ? 'hidden'
                                    : 'visible',
                              }}
                            />
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <Row>
                            <Col className="p-0">
                              <div className="profile-business-status-content">
                                <div className="profile-business-logo">
                                  {/*eslint-disable-next-line @next/next/no-img-element*/}
                                  <img
                                    id="logo-image-crop"
                                    src={
                                      imgUrl ||
                                      profile.logo ||
                                      '/images/sem-foto.jpeg'
                                    }
                                    // layout="fill"
                                    alt="Logo do Perfil"
                                    style={{
                                      maxWidth: 100,
                                      height: 100,
                                    }}
                                  />
                                  <label className=" w-100 profile-business-input-logo position-relative rounded border border-0 text-center">
                                    <input
                                      type="file"
                                      id="logo-display"
                                      // accept="image/png, image/jpeg"
                                      onChange={(e: FormEvent) => {
                                        setTypeCrop('profileLogo')
                                        // setImageDimensions({
                                        //   width: 145,
                                        //   height: 145,
                                        // });
                                        setIdImage('logo-display')
                                        setInputFileImage(
                                          e.target as HTMLInputElement
                                        )
                                      }}
                                      className="w-100"
                                    />
                                    <span className="d-block w-100 profile-business-input-logo-span text-center">
                                      <MdPhotoLibrary size={30} color="#fff" />
                                      <span className="fs-8 ps-2 text-white">
                                        Logo
                                      </span>
                                    </span>
                                  </label>
                                </div>
                                <div className="d-flex flex-column align-items-center mt-2">
                                  <h5 className="text-uppercase fw-bold fs-6 mb-0">
                                    {profile.name}
                                  </h5>
                                  <p className="fs-8 m-0 mb-2">
                                    {profile.description}
                                  </p>
                                  <span className="fs-6 text-uppercase text-green fw-bold d-block profile-business-status-opening border p-2 px-4 text-center">
                                    {t('open_n')}
                                  </span>
                                </div>
                              </div>
                            </Col>
                          </Row>
                          <Row className="mt-3">
                            <Col className="px-auto">
                              <Container
                                fluid
                                className="profile-business-status-content m-0 px-0"
                              >
                                <Row
                                  className="profile-business-status-content fs-8 text-center align-middle"
                                  style={{
                                    backgroundColor: profile.color,
                                    color: textInfoColor,
                                  }}
                                >
                                  <label className="w-100 profile-business-input-logo position-absolute rounded border border-0 px-0 text-start">
                                    <input
                                      type="color"
                                      className="w-100"
                                      value={bgInfoColor}
                                      name="color"
                                      onChange={(e) => {
                                        profile.color = e.target.value
                                        setTextInfoColor(
                                          colorLuminosity(e.target.value).color
                                        )
                                        setBgInfoColor(e.target.value)
                                      }}
                                    />
                                    <span className="d-block w-100 profile-business-input-logo-span">
                                      <IoColorPaletteSharp
                                        size={24}
                                        color="#fff"
                                        className="m-1"
                                      />
                                      <span className="fs-7 ps-2 text-white">
                                        {t('store_color')}
                                      </span>
                                    </span>
                                  </label>
                                  <Col className="p-0">
                                    <div className="pt-2">
                                      <p className="fs-7 fw-bold profile-business-info-text m-0">
                                        <MdAttachMoney /> {t('delivery_fee')}
                                      </p>
                                      <p className="fs-8">{t('calculate')}</p>
                                    </div>
                                  </Col>
                                  <Col
                                    className="p-0"
                                    style={{
                                      backdropFilter: 'brightness(80%)',
                                    }}
                                  >
                                    <div className="pt-2">
                                      <p className="fs-7 fw-bold profile-business-info-text m-0">
                                        <MdAlarm /> {t('wait_time')}
                                      </p>
                                      <p className="fs-8">{t('calculate')}</p>
                                    </div>
                                  </Col>
                                  <Col className="p-0">
                                    <div className="pt-2">
                                      <p className="fs-7 fw-bold profile-business-info-text m-0">
                                        <BsTelephoneFill />
                                        {t('phone')}
                                      </p>
                                      <p className="fs-8">
                                        {maskedPhone(
                                          profile?.whatsapp?.substring(2) ||
                                            '00000000000'
                                        )}
                                      </p>
                                    </div>
                                  </Col>
                                </Row>
                              </Container>
                              {displayPhone}
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Container>
              </Card.Body>
            </Card>
          )}
        </section>
      </form>
    </>
  )
}
