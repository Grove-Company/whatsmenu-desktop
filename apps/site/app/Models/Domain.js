'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Domain extends Model {
  static boot() {
    super.boot()

    this.addHook('afterFind', (domain) => {
      domain.options = JSON.parse(domain.options)
    })

    this.addHook('afterFetch', (domains) => {
      domains.forEach(domain => {
        domain.options = JSON.parse(domain.options)
      });
    })

    this.addHook('afterPaginate', (domains) => {
      domains.forEach(domain => {
        domain.options = JSON.parse(domain.options)
      });
    })

  }

  profile() {
    return this.belongsTo('App/Models/Profile', 'profileId', 'id')
  }
}

module.exports = Domain
