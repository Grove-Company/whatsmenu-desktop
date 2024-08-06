'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategoriesSchema extends Schema {
  up () {
    this.table('categories', (table) => {
      // alter table
      table.json('options').after('disponibility')
    })
  }

  down () {
    this.table('categories', (table) => {
      // reverse alternations
      table.dropColumn('options')
    })
  }
}

module.exports = CategoriesSchema
