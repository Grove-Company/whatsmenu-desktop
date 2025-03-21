import { createContext, Dispatch, SetStateAction } from "react";
import { PrintEnvironmentConfig, PrintEnvironmentType, ProductCategory } from "../types_print-environment";
import { Printer } from "../../@types/store";

interface PrintTypes {
  currentPage: string;
  setCurrentPage: Dispatch<SetStateAction<string>>
  productCategories: ProductCategory[];
  setProductCategories: Dispatch<SetStateAction<ProductCategory[]>>
  locations: PrintEnvironmentConfig[];
  setLocations: Dispatch<SetStateAction<PrintEnvironmentConfig[]>>
  selectedType: PrintEnvironmentType;
  setSelectedType: Dispatch<SetStateAction<PrintEnvironmentType>>;
  envId: number;
  setEnvId: Dispatch<SetStateAction<number>>;
  envType: PrintEnvironmentType;
  setEnvType: Dispatch<SetStateAction<PrintEnvironmentType>>;
  envName: string;
  setEnvName: Dispatch<SetStateAction<string>>;
  envCategories: ProductCategory[];
  setEnvCategories: Dispatch<SetStateAction<ProductCategory[]>>
  allPrinters: Printer[];
  setAllPrinters: Dispatch<SetStateAction<Printer[]>>
  selectedPrinter: Printer;
  setSelectedPrinter: Dispatch<SetStateAction<Printer>>
  selectedPrinterEnvs: number[];
  setSelectedPrinterEnvs: Dispatch<SetStateAction<number[]>>
}

const PrintContext = createContext<PrintTypes | undefined>(undefined);

export default PrintContext;