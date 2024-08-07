import { useSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { Button, Card, Col, Container, Figure, Form, FormGroup, FormLabel, InputGroup, Modal, Row } from "react-bootstrap";
import { AppContext } from "../../../../../context/app.ctx";
import { MenuContext } from "../../../../../context/menu.ctx";
import { apiRoute, blobToBase64, copy, encryptEmoji, getLastItem, hash, inputFocus, mask, modifyFontValues, scrollToElement, verifyEmptyNameLength } from "../../../../../utils/wm-functions";
import { Dates } from "../../../../Dates";
import Week from "../../../../../types/dates";
import { MenuComponent } from "../../../../Menu";
import Complement, { ComplementType, ItemComplementType } from "../../../../../types/complements";
import Product, { DisponibilityType, ProductType } from "../../../../../types/product";
import { ComponentComplement } from "../../Complements";
import Category from "../../../../../types/category";
import Image from "next/legacy/image";
import { CropModal } from "../../../CropModal";
import { OverlaySpinner } from "../../../../OverlaySpinner";
import { IoInformationCircle } from "react-icons/io5";
import { BsArrowLeftSquare } from "react-icons/bs";


type MassiveProps = {
    show: boolean,
    category: Category,
    onHide: (...props: any) => void;
}

export function CreateMassiveProducts({ category, ...props }: MassiveProps) {

    const { data: session } = useSession();

    const { handleShowToast, handleConfirmModal, plansCategory } = useContext(AppContext);
    const { categories, setCategories } = useContext(MenuContext);

    const [massiveProducts, setMassiveProducts] = useState<Partial<ProductType>[]>([]);
    const [week, setWeek] = useState<Week>(new Week());
    const [store, setStore] = useState({
        delivery: true,
        table: true,
        package: true,
    });
    const [complements, setComplements] = useState<Complement[]>([]);
    const [recicledComplements, setRecicledComplements] = useState<{ id?: number, link?: boolean }[]>([]);
    const [step, setStep] = useState<number>(1);
    const [invalidWeek, setInvalidWeek] = useState<boolean>(false);
    const [updateHTML, setUpdateHTML] = useState<number>(0);
    const [inputFileImage, setInputFileImage] = useState<HTMLInputElement>()
    const [prodSrcId, setProdSrcId] = useState<string>("")
    const [images, setImages] = useState<any>({});
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [productTarget, setProductTarget] = useState<Partial<Product>>({});
    const [invalidComplement, setInvalidComplement] = useState<boolean>(false);

    const resetState = () => {
        setStep(1);
        setComplements([]);
        setRecicledComplements([]);
        setMassiveProducts([]);
        setWeek(new Week());
    }

    const createProductsMassive = async () => {
        try {
            if (massiveProducts.length) {
                if (verifyEmptyNameLength(massiveProducts, "id")) {
                    return
                };
            }

            if (invalidWeek) {
                handleShowToast({
                    type: `${invalidWeek ? "alert" : "success"}`,
                    content: `${invalidWeek
                        ? "Os Produtos não foram criados pois há horários inválidos. Por favor corrija os campos destacados e tente novamente"
                        : ""
                        }`,
                    title: "",
                });
                return
            }

            setShowSpinner(true);

            const productsToCreate = massiveProducts.map(prod => {
                prod.image = "";

                return prod
            })

            const form = document.getElementById("massive-products") as HTMLFormElement;

            const formData = new FormData(form);

            productsToCreate.forEach((product => {
                if (product.name) {
                    product.name = encryptEmoji(product.name);
                }

                if (product.description) {
                    product.description = encryptEmoji(product.description);
                }

                if(product.value !== undefined && isNaN(product.value)){
                    product.value = 0;
                }

                if(product.valueTable !== undefined && isNaN(product.valueTable)){
                    product.value = 0;
                }

            }));
            
            formData.append("products", copy(productsToCreate, 'json'));
            formData.append("recicle", copy(recicledComplements, 'json'))
            formData.append("complements", copy(complements, 'json'));
            formData.append("week", copy(week, 'json'));
            formData.append("store", copy(store, 'json'));

            for (const [key, value] of Object.entries(images)) {
                formData.append(key, value as Blob);
            }

            // await category.massiveAPI(formData, session)
            const result = await Category.createMassiveAPI(formData, session, category);

            setCategories([...categories])

            handleShowToast({
                position: 'middle-center',
                type: 'success',
                title: 'Produtos',
                content: 'Todos os produtos foram criados com sucesso.',
                show: true
            })

            setShowSpinner(false);
            props.onHide(resetState)

        } catch (e) {
            console.error(e);
            handleShowToast({
                position: 'middle-center',
                type: 'erro',
                title: 'Produtos',
                content: 'Produtos não foram criados.',
                show: true
            });

            setShowSpinner(false);
        }
    }

    const addMassiveProducts = () => {
        const newProd: Partial<ProductType> = {
            id: parseInt(String(Math.random() * (100000 - 1) + 1)),
            categoryId: category.id,
            name: "",
            description: "",
            image: "",
            order: (category?.products?.length ?? 0) + massiveProducts.length,
            promoteStatus: false,
            promoteStatusTable: false,
            promoteValue: 0,
            promoteValueTable: 0,
            status: true,
            value: 0,
            valueTable: 0
        }

        if (verifyEmptyNameLength(massiveProducts, "id", {
            partialQuery: "#prod-name-",
            queryParentElement: "#create-massive-modal"

        })) {
            return
        }

        setMassiveProducts([...massiveProducts, newProd]);

        const interval = setInterval(() => {
            const prod = document.querySelector(`#prod-${newProd.id}`);
            const prodInput = document.querySelector(`#prod-name-${newProd.id}`) as HTMLInputElement;
            if (prod) {
                prod.scrollIntoView();
            }

            if (prodInput) {
                prodInput.focus();
            }

            if (prod && prodInput) {
                clearInterval(interval);
            }
        }, 100);
    }

    const replicateItem = async (product: Partial<ProductType>) => {
        if (verifyEmptyNameLength(massiveProducts, "id", {
            partialQuery: "#prod-name-",
            queryParentElement: "#create-massive-modal"
        })) {
            return
        }

        const image = images[`image_${product.id}`];

        const newProduct = copy(product);
        newProduct.id = parseInt(String(Math.random() * (100000 - 1) + 1));
        newProduct.order = (category?.products?.length ?? 0) + massiveProducts.length

        let url = "";
        if (image) {
            url = await blobToBase64(image) as string;
            newProduct.image = url;
            images[`image_${newProduct.id}`] = image;
        }

        setMassiveProducts([...massiveProducts, newProduct]);

        setTimeout(() => {

            const imageInput = document.getElementById(`image-${newProduct.id}`) as HTMLImageElement;
            if (imageInput && image) {
                imageInput.src = url as string;
                setProdSrcId("");
            }

        }, 30);

        const interval = setInterval(() => {
            const prod = document.querySelector(`#prod-${newProduct.id}`);
            const prodInput = document.querySelector(`#prod-name-${newProduct.id}`) as HTMLInputElement;
            if (prod) {
                prod.scrollIntoView();
            }

            if (prodInput) {
                prodInput.focus();
                prodInput.select();
            }

            if (prod && prodInput) {
                clearInterval(interval);
            }
        }, 100);
    }

    /** Aciona o passo anterior do modal */
    const backStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    }
    /** Aciona o próximo passo do modal */
    const nextStep = () => {
        if (verifyEmptyNameLength(massiveProducts, "id", {
            partialQuery: "#prod-name-",
            queryParentElement: "#create-massive-modal",
        })) {
            return
        }

        if (step === 2) {
            const complement = getLastItem(complements) as Complement;
            if (complement) {
                if (complement.name.trim() === "") {
                    inputFocus(`#complement-name-${complement.id}`, {
                        selectText: true
                    });
                    return
                } else {
                    // const lastItem = getLastItem(complement.itens) as ItemComplementType;

                    // if (lastItem) {
                    //     inputFocus(`#complement-item-${lastItem.code}`);
                    //     return
                    // }

                    if (verifyEmptyNameLength(complement.itens, "code", { partialQuery: "#complement-item-" })) {
                        return
                    }
                }
            }
        }

        setStep(step + 1);
    }

    return (
        <>
            <div
                onKeyDown={e => {
                    const keys = ["KeyA", "KeyR", "KeyI", "Enter", "ArrowLeft", "ArrowRight"];
                    const keyPressed = e.code;

                    if (e.altKey) {
                        if (keyPressed === "KeyA") {
                            addMassiveProducts();
                        }

                        if (massiveProducts.length) {
                            const lastProd = getLastItem(massiveProducts) as ProductType;

                            if (keyPressed === "KeyR") {
                                replicateItem(lastProd);
                            }

                            if (keyPressed === "KeyI" && !e.metaKey) {
                                const form = document.getElementById("massive-products");
                                const inputFile = form?.querySelector(`#input-${lastProd.id}-${massiveProducts.length - 1}`) as HTMLInputElement;
                                if (inputFile) {
                                    inputFile.click();
                                }
                            }

                            if (keyPressed === "Enter") {
                                createProductsMassive();
                            }

                            if (keyPressed === "ArrowLeft") {
                                step > 1 && setStep(step - 1)
                            }

                            if (keyPressed === "ArrowRight") {
                                if (verifyEmptyNameLength(massiveProducts, "id", { partialQuery: "#prod-name-" })) {
                                    return
                                }
                                step < 3 && setStep(step + 1)
                            }
                        }

                        if (keys.includes(keyPressed)) {
                            e.preventDefault()
                        }
                    }
                }}
            >

                <Modal
                    {...props}
                    size="xl"
                    backdrop="static"
                    dialogClassName="modal-90 mx-auto"
                    onEnter={addMassiveProducts}
                    onExit={resetState}
                    centered
                >
                    <div className="position-relative">
                        <Modal.Header className="justify-content-between">
                            <h3>Criar Produtos em Massa ({category.name})</h3>
                            <span className="cursor-pointer"
                                onClick={() => {
                                    handleConfirmModal({
                                        show: true,
                                        title: "Atalhos",
                                        message:
                                            "ALT + &nbsp;I: &nbsp; Adicionar Imagem\n" +
                                            "ALT + A: &nbsp; Adicionar Produto\n" +
                                            "ALT + R: &nbsp; Replicar Produto\n" +
                                            "ALT + Enter: &nbsp; Criar Produtos\n" +
                                            "ALT + Seta Direita: &nbsp; Próximo Passo\n" +
                                            "ALT + Seta Esquerda: &nbsp; Voltar um Passo\n",
                                        alignText: "start",
                                        cancelButton: "none",
                                        confirmButton: "Ok",
                                        size: 30
                                    })
                                }}
                            >
                                <IoInformationCircle size={40} />
                            </span>
                        </Modal.Header>
                        <Modal.Body
                            id="create-massive-modal"
                            className={`overflow-auto position-relative`}
                            style={{ height: '60vh' }}

                        >
                            <form id="massive-products">
                                {
                                    step === 1 &&
                                    (massiveProducts.length
                                        ?
                                        massiveProducts.map((prod, index) => {
                                            return (
                                                <div key={`key-${prod.id}-${index}`}>
                                                    {
                                                        index > 0 && <hr />
                                                    }
                                                    <Row key={`prodKey${prod.id}-${index}}`} className={`${index > 0 && "pt-3"}`}>
                                                        <Col sm={4} className={`d-flex align-items-end ${(massiveProducts.length - index) !== 1 && "pb-3"}`}>
                                                            <InputGroup key={`prod-key-group-${prod.id}-${index}`} className="flex-grow-1 text-end">
                                                                <label className="w-100 cursor-pointer" id={`label-${prod.id}-${index}`} htmlFor={`input-${prod.id}-${index}`}>
                                                                    <Figure.Caption className="text-center">
                                                                        (resolução recomendada de 600x450)
                                                                    </Figure.Caption>
                                                                    <Form.Control
                                                                        type="file"
                                                                        id={`input-${prod.id}-${index}`}
                                                                        className="position-absolute"
                                                                        tabIndex={-1}
                                                                        onChange={e => {
                                                                            setProductTarget(prod);
                                                                            setInputFileImage(e.target as HTMLInputElement)
                                                                        }}
                                                                        style={{ visibility: "hidden" }}
                                                                    >
                                                                    </Form.Control>
                                                                    {/*eslint-disable-next-line @next/next/no-img-element*/}
                                                                    <img
                                                                        src={prod.image || "/images/no-img.jpeg"}
                                                                        id={`image-${prod.id}`}
                                                                        width={600}
                                                                        height={450}
                                                                        alt="Imagem do Produto"
                                                                        style={{ maxWidth: "100%", maxHeight: 250 }}
                                                                    />
                                                                    <span className="d-block w-100 fw-bold mt-2 bg-success text-white p-2 text-center rounded" >Adicionar imagem</span>
                                                                </label>

                                                            </InputGroup>
                                                        </Col>
                                                        <Col sm="8">
                                                            <div id={`prod-${prod.id}`} key={`prod-key-${prod.id}-${index}`} className="mb-3 border rounded p-2 fs-7 mt-2 mt-md-0">
                                                                <Row>
                                                                    <Col>
                                                                        <h5 className="fw-bold">Produto {index + 1}</h5>
                                                                    </Col>
                                                                    <Col sm className="d-flex justify-content-end">
                                                                        {
                                                                            massiveProducts.length > 1 &&
                                                                            <Button
                                                                                variant="link"
                                                                                onClick={e => {
                                                                                    delete images[`${prod.id}`];

                                                                                    const newProducts = massiveProducts.filter(el => el.id !== prod.id).map((prod, indexProd) => {
                                                                                        prod.order = (category?.products?.length ?? 0) + indexProd;
                                                                                        return prod
                                                                                    });
                                                                                    setMassiveProducts(newProducts)

                                                                                }}>Excluir
                                                                            </Button>
                                                                        }
                                                                    </Col>
                                                                </Row>
                                                                <Row>
                                                                    <Col>

                                                                        <FormGroup>
                                                                            <Form.Label>Nome do Produto</Form.Label>
                                                                            <Form.Control
                                                                                id={`prod-name-${prod.id}`}
                                                                                maxLength={55}
                                                                                defaultValue={prod.name}
                                                                                onChange={e => {
                                                                                    prod.name = e.target.value;
                                                                                    setUpdateHTML(updateHTML + 1);
                                                                                }}
                                                                                onKeyDown={(e) => modifyFontValues(e, { prop: prod.name, setUpdateHTML })}
                                                                            />


                                                                            {/* <Form.Control.Feedback
                                                                                    tooltip
                                                                                    type="invalid"
                                                                                    style={{ zIndex: 0 }}
                                                                                >
                                                                                    Digite um nome para o produto
                                                                                </Form.Control.Feedback> */}
                                                                        </FormGroup>

                                                                        <div className="text-end">
                                                                            <span className="me"><span id={`prodName-${prod.id}`}>{prod.name?.length}</span> / 55 caracteres </span>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                                <Row className="mt-2">
                                                                    {
                                                                        (plansCategory.includes("basic") || plansCategory.includes("package")) &&
                                                                        <Col sm={plansCategory.includes("table") ? "6" : "12"}>
                                                                            <FormGroup>
                                                                                <Form.Label>Preço Delivery</Form.Label>
                                                                                <Form.Control
                                                                                    defaultValue={prod.value}
                                                                                    onChange={e => {
                                                                                        mask(e, "currency");
                                                                                        prod.value = Number(e.target.value);
                                                                                    }} />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    }
                                                                    {
                                                                        plansCategory.includes("table") &&
                                                                        <Col sm={plansCategory.length === 1 ? "12" : "6"}>
                                                                            <FormGroup>
                                                                                <Form.Label>Preço Mesa</Form.Label>
                                                                                <Form.Control
                                                                                    defaultValue={prod.valueTable}
                                                                                    onChange={e => {
                                                                                        mask(e, "currency");
                                                                                        prod.valueTable = Number(e.target.value);
                                                                                    }} />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    }
                                                                    {/* <Col sm="3">
                                                                        <FormGroup>
                                                                            <FormLabel className="mb-0">
                                                                                <Form.Switch
                                                                                    defaultChecked={prod.promoteStatus}
                                                                                    id="Promoção Delivery"
                                                                                    label="Promoção Delivery"
                                                                                    onChange={e => {
                                                                                        prod.promoteStatus = e.target.checked;
                                                                                    }} />
                                                                            </FormLabel>
                                                                            <Form.Control
                                                                                defaultValue={prod.promoteValue}
                                                                                onChange={e => {
                                                                                    prod.promoteValue = parseFloat(e.target.value);
                                                                                }}
                                                                            />
                                                                        </FormGroup>
                                                                        <FormGroup>
                                                                            <FormLabel className="mb-0 mt-1">
                                                                                <Form.Switch
                                                                                    defaultChecked={prod.promoteStatusTable}
                                                                                    id="Promoção Mesa"
                                                                                    label="Promoção Mesa"
                                                                                    onChange={e => {
                                                                                        prod.promoteStatusTable = e.target.checked;
                                                                                    }}
                                                                                />
                                                                            </FormLabel>
                                                                            <Form.Control
                                                                                defaultValue={prod.promoteValueTable}
                                                                                onChange={e => {
                                                                                    prod.promoteValueTable = parseFloat(e.target.value);
                                                                                }}
                                                                            />
                                                                        </FormGroup>
                                                                    </Col> */}
                                                                </Row>
                                                                <Row className="mt-2">
                                                                    <Col sm>
                                                                        <FormGroup>
                                                                            <Form.Label>Descrição do Produto</Form.Label>
                                                                            <Form.Control
                                                                                as="textarea"
                                                                                maxLength={500}
                                                                                defaultValue={prod.description}
                                                                                onChange={e => {
                                                                                    prod.description = e.target.value;
                                                                                    setUpdateHTML(updateHTML + 1);
                                                                                }}
                                                                                onKeyDown={(e) => modifyFontValues(e, { prop: prod.description, setUpdateHTML })}
                                                                            />
                                                                            <div className="text-end">
                                                                                <span className="me"><span id={`prodDesc-${prod.id}`}>{prod.description?.length}</span> / 500 caracteres</span>
                                                                            </div>
                                                                        </FormGroup>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                            {
                                                                (massiveProducts.length - index) === 1 &&
                                                                <div className="d-flex gap-2">
                                                                    <Button
                                                                        style={{ flex: "0 1 150px" }}
                                                                        disabled={step > 1}
                                                                        onClick={e => addMassiveProducts()}>
                                                                        Adicionar +
                                                                    </Button>
                                                                    <Button
                                                                        style={{ flex: "0 1 150px" }}
                                                                        disabled={step > 1}
                                                                        variant="success"
                                                                        onClick={e => replicateItem(prod)}>
                                                                        Replicar
                                                                    </Button>
                                                                </div>
                                                            }
                                                        </Col>

                                                    </Row>
                                                </div>
                                            )
                                        })
                                        :
                                        <h2 className="text-center">Nenhum produto adicionado</h2>)
                                }
                            </form>
                            {
                                step === 2 &&
                                <ComponentComplement
                                    complements={complements}
                                    recicled={recicledComplements}
                                    typeModal="massive"
                                    complementType="default"
                                    showVinculateComplement={massiveProducts.length > 1}
                                    saveComplements={(newComplements) => setComplements(newComplements)}
                                    saveRecicledComplements={(recicled) => setRecicledComplements(recicled)}
                                />
                            }
                            {
                                step === 3 &&
                                <div>
                                    <Card className="mt-4">
                                        <Card.Header>
                                            <h4>
                                                <b>Disponível para:</b>
                                            </h4>
                                        </Card.Header>
                                        <Card.Body>
                                            <Container fluid className="px-0 mx-0">
                                                <Row className="text-dark">
                                                    <Col sm>
                                                        <h6 className="mb-4"></h6>
                                                        <div className="d-flex gap-3">
                                                            <div className="d-flex flex-column align-items-center">
                                                                <Form.Label>
                                                                    Delivery
                                                                    <Form.Switch
                                                                        className="pt-2"
                                                                        defaultChecked={store.delivery}
                                                                        onChange={(e) => {
                                                                            setStore({ ...store, delivery: e.target.checked })
                                                                        }}
                                                                    />
                                                                </Form.Label>
                                                            </div>
                                                            <div className="d-flex flex-column align-items-center">
                                                                <Form.Label>
                                                                    Mesa
                                                                    <Form.Switch
                                                                        className="pt-2"
                                                                        defaultChecked={store.table}
                                                                        onChange={(e) => {
                                                                            setStore({ ...store, table: e.target.checked })
                                                                        }}
                                                                    />
                                                                </Form.Label>
                                                            </div>
                                                            <div className="d-flex flex-column align-items-center">
                                                                <Form.Label className="text-center">
                                                                    Encomenda
                                                                    <Form.Switch
                                                                        className="pt-2"
                                                                        defaultChecked={store.package}
                                                                        onChange={(e) => {
                                                                            setStore({ ...store, package: e.target.checked })
                                                                        }}
                                                                    />
                                                                </Form.Label>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Container>
                                        </Card.Body>
                                    </Card>
                                    <Dates
                                        type="menu"
                                        title="Adicionar Horário de Disponibilidade"
                                        week={week}
                                        setWeek={setWeek}
                                        saveWeek={setWeek}
                                        setInvalidWeek={setInvalidWeek}
                                    />
                                </div>
                            }
                        </Modal.Body>

                        <Modal.Footer className="">
                            <Row className="d-flex flex-grow-1">
                                <Col className="flex-grow-1 d-flex gap-2 flex-wrap justify-content-between">
                                    <div className="flex-grow-1 flex-md-grow-0 d-flex gap-2 order-3 order-md-0   ">
                                        <Button
                                            disabled={!massiveProducts.length}
                                            variant="danger"
                                            className="w-100 order-1 order-md-0"
                                            onClick={e => {
                                                props.onHide();
                                                resetState();
                                            }}>
                                            Cancelar
                                        </Button>
                                        {
                                            step > 1 &&
                                            <Button onClick={backStep} className="order-0 order-md-1"  >
                                                Voltar um passo
                                            </Button>
                                        }
                                    </div>
                                    <div className="d-flex gap-2 justify-content-end flex-grow-1 flex-md-grow-0">
                                        <Button
                                            style={{ flex: "1 0 150px" }}
                                            disabled={!massiveProducts.length || (invalidWeek && step === 3)}
                                            variant={step === 3 ? "success" : "orange"}
                                            onClick={step === 3 ? createProductsMassive : nextStep}>
                                            {
                                                step < 3 ?
                                                    "Próximo passo" : "Criar"
                                            }
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Modal.Footer>
                        <OverlaySpinner
                            show={showSpinner}
                            textSpinner="Criando Produtos..."
                        />
                    </div>
                </Modal>
                <CropModal
                    show={!!inputFileImage}
                    inputFile={inputFileImage}
                    typeCrop="productImage"
                    setImageBlob={async (blob, url) => {
                        if (productTarget) {
                            const image = document.getElementById(`image-${productTarget.id}`) as HTMLImageElement;
                            if (image) {
                                image.src = url as string;
                                productTarget.image = url;
                                setProdSrcId("")
                            }

                            images[`image_${productTarget.id}`] = blob;
                        }
                    }}
                    onHide={() => {
                        setInputFileImage(undefined)
                    }}
                />
            </div>

        </>
    )
}