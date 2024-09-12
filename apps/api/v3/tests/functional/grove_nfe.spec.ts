import { CartFactory } from '#database/factories/cart_factory'
import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import GroveNfeService from '#services/grove_nfe_service'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import sinon from 'sinon'

test.group('Controller Grove Nfe', (group) => {
  let user: User

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await user.load('profile')
  })

  test('Deve ser possível receber atualizações via webhook do Grove Nfe', async ({
    assert,
    client,
  }) => {
    const groveNfeServiceStub = sinon.stub(GroveNfeService.prototype, 'updateProfile')

    const company = {
      id: 1,
      external_id: String(user.profile.id),
      controls: {
        fiscal_notes: {
          day_limiter: 1,
          forms_payments: [{ type: 'money' }],
          nfce: true,
          nfe: false,
        },
      },
      created_at: DateTime.local().toISO(),
    }
    groveNfeServiceStub.resolves()
    try {
      const response = await client.post('/grovenfe/webhook').json({
        event: 'COMPANY_CREATED',
        data: {
          company,
        },
      })
      response.assertStatus(200)
      assert.equal(response.body().success, true)
      assert.equal(response.body().message, 'Evento recebido')
    } catch (error) {
      throw error
    } finally {
      groveNfeServiceStub.restore()
    }

    try {
      const response = await client.post('/grovenfe/webhook').json({
        event: 'COMPANY_UPDATED',
        data: {
          company,
        },
      })
      response.assertStatus(200)
      assert.equal(response.body().success, true)
      assert.equal(response.body().message, 'Evento recebido')
    } catch (error) {
      throw error
    }
  })

  test('Caso o evento seja inválido, deve retornar um erro', async ({ client, assert }) => {
    let response
    const groveNfeServiceStub = sinon.stub(GroveNfeService.prototype, 'updateProfile').throws()

    try {
      response = await client.post('/grovenfe/webhook').json({
        event: 'COMPANY_UPDATED',
        data: {
          company: {},
        },
      })
    } catch (error) {
      response?.assertStatus(500)
    } finally {
      groveNfeServiceStub.restore()
    }
  })

  test('Deve ser possível adicionar uma nota fiscal ao carrinho', async ({ assert, client }) => {
    const groveNfeServiceStub = sinon.stub(GroveNfeService.prototype, 'addFiscalNoteToCart')

    const fiscalNote = {
      externalId: String(user.profile.id),
      created_at: DateTime.local().toISO(),
    }

    groveNfeServiceStub.resolves()
    try {
      const response = await client.post('/grovenfe/webhook').json({
        event: 'FISCAL_NOTE_CREATED',
        data: {
          fiscal_note: fiscalNote,
        },
      })
      response.assertStatus(200)
      assert.equal(response.body().success, true)
      assert.equal(response.body().message, 'Evento recebido')
    } catch (error) {
      throw error
    } finally {
      groveNfeServiceStub.restore()
    }
  })

  test('Com o carrinho criado, deve ser possivel criar o fiscal_note', async ({
    assert,
    client,
  }) => {})

  test('Deve ser possível cancelar uma nota fiscal do carrinho', async ({ assert, client }) => {
    const groveNfeServiceStub = sinon.stub(GroveNfeService.prototype, 'deleteFiscalNoteFromCart')

    const fiscalNote = {
      externalId: String(user.profile.id),
      created_at: DateTime.local().toISO(),
    }

    groveNfeServiceStub.resolves()
    try {
      const response = await client.post('/grovenfe/webhook').json({
        event: 'FISCAL_NOTE_CANCELLED',
        data: {
          fiscal_note: fiscalNote,
        },
      })
      response.assertStatus(200)
      assert.equal(response.body().success, true)
      assert.equal(response.body().message, 'Evento recebido')
    } catch (error) {
      throw error
    } finally {
      groveNfeServiceStub.restore()
    }
  })

  test('Deve ser possível atualizar uma nota fiscal do carrinho', async ({ assert, client }) => {
    const groveNfeServiceStub = sinon.stub(GroveNfeService.prototype, 'addFiscalNoteToCart')

    const fiscalNote = {
      externalId: String(user.profile.id),
      created_at: DateTime.local().toISO(),
    }

    groveNfeServiceStub.resolves()
    try {
      const response = await client.post('/grovenfe/webhook').json({
        event: 'FISCAL_NOTE_UPDATED',
        data: {
          fiscal_note: fiscalNote,
        },
      })
      response.assertStatus(200)
      assert.equal(response.body().success, true)
      assert.equal(response.body().message, 'Evento recebido')
    } catch (error) {
      throw error
    } finally {
      groveNfeServiceStub.restore()
    }
  })

  test('Deve acontecer default caso o evento seja inválido', async ({ assert, client }) => {
    const groveNfeServiceStub = sinon.stub(GroveNfeService.prototype, 'addFiscalNoteToCart')

    const fiscalNote = {
      externalId: String(user.profile.id),
      created_at: DateTime.local().toISO(),
    }

    groveNfeServiceStub.resolves()
    try {
      const response = await client.post('/grovenfe/webhook').json({
        event: 'INVALID_EVENT',
        data: {
          fiscal_note: fiscalNote,
        },
      })
      response.assertStatus(200)
      assert.equal(response.body().success, true)
      assert.equal(response.body().message, 'Evento recebido')
    } catch (error) {
      throw error
    } finally {
      groveNfeServiceStub.restore()
    }
  })
})
