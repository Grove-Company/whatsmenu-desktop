export interface DNSRecord {
  id: string
  zone_id: string
  zone_name: string
  name: string
  type: string
  content: string
  proxiable: boolean
  proxied: boolean
  ttl: number
  locked: boolean
  meta: Meta
  created_on: string
  modified_on: string
  contents: string
}

export interface Meta {
  auto_added: boolean
  managed_by_apps: boolean
  managed_by_argo_tunnel: boolean
  source: string
}

export interface DomainType {
  id?: number
  profileId?: number
  name: string
  key?: string
  options?: any
  default?: boolean
  dns?: DNSRecord[]
  created_at?: string
  updated_at?: string
}

export default class Domain {
  id?: number
  profileId?: number
  name: string
  key?: string
  options?: any
  default?: boolean
  dns?: DNSRecord[]
  created_at?: string
  updated_at?: string

  constructor(domain: DomainType) {
    this.id = domain.id
    this.profileId = domain.profileId
    this.name = domain.name
    this.key = domain.key
    this.options = domain.options
    this.default = domain.default
    this.dns = domain.dns
    this.created_at = domain.created_at
    this.updated_at = domain.updated_at
  }
}
