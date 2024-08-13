import { useState } from 'react'
import { Button } from 'react-bootstrap'
import BankForm from './bankForm'

interface PresentationProps {
  togglePresentation: () => void
}

export default function BankPresentation({
  togglePresentation,
}: PresentationProps) {
  return (
    <div className="d-flex flex-column p-4 ">
      <p className="text-center">
        Adicione seus dados bancários para receber seus pagamentos online!{' '}
      </p>
      <Button
        className="mx-auto mb-2 mt-auto"
        type="submit"
        onClick={() => togglePresentation()}
      >
        Configurar pagamento online
      </Button>
    </div>
  )
}
