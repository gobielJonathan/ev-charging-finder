export interface AddressInfo {
  ID: number
  Title: string
  AddressLine1: string | null
  AddressLine2: string | null
  Town: string | null
  StateOrProvince: string | null
  Postcode: string | null
  CountryID: number
  Country: {
    ISOCode: string
    ContinentCode: string
    ID: number
    Title: string
  } | null
  Latitude: number
  Longitude: number
  ContactTelephone1: string | null
  ContactTelephone2: string | null
  ContactEmail: string | null
  AccessComments: string | null
  RelatedURL: string | null
  Distance: number | null
  DistanceUnit: number
}

export interface ConnectionType {
  FormalName: string | null
  IsDiscontinued: boolean | null
  IsObsolete: boolean | null
  ID: number
  Title: string
}

export interface StatusType {
  IsOperational: boolean | null
  IsUserSelectable: boolean
  ID: number
  Title: string
}

export interface UsageType {
  IsPayAtLocation: boolean | null
  IsMembershipRequired: boolean | null
  IsAccessKeyRequired: boolean | null
  ID: number
  Title: string
}

export interface Connection {
  ID: number
  ConnectionTypeID: number
  ConnectionType: ConnectionType | null
  Reference: string | null
  StatusTypeID: number | null
  StatusType: StatusType | null
  LevelID: number | null
  Level: {
    Comments: string | null
    IsFastChargeCapable: boolean
    ID: number
    Title: string
  } | null
  Amps: number | null
  Voltage: number | null
  PowerKW: number | null
  CurrentTypeID: number | null
  CurrentType: {
    Description: string | null
    ID: number
    Title: string
  } | null
  Quantity: number | null
  Comments: string | null
}

export interface OperatorInfo {
  WebsiteURL: string | null
  Comments: string | null
  PhonePrimaryContact: string | null
  PhoneSecondaryContact: string | null
  IsPrivateIndividual: boolean | null
  AddressInfo: AddressInfo | null
  BookingURL: string | null
  ContactEmail: string | null
  FaultReportEmail: string | null
  IsRestrictedEdit: boolean | null
  ID: number
  Title: string
}

export interface ChargingStation {
  DataProvider: {
    WebsiteURL: string
    Comments: string | null
    DataProviderStatusType: { IsProviderEnabled: boolean; ID: number; Title: string }
    IsRestrictedEdit: boolean
    IsOpenDataLicensed: boolean
    IsApprovedImport: boolean
    License: string | null
    DateLastImported: string | null
    ID: number
    Title: string
  }
  OperatorInfo: OperatorInfo | null
  UsageType: UsageType | null
  UsageCost: string | null
  AddressInfo: AddressInfo
  Connections: Connection[]
  NumberOfPoints: number | null
  GeneralComments: string | null
  DatePlanned: string | null
  DateLastConfirmed: string | null
  StatusType: StatusType | null
  DateLastStatusUpdate: string | null
  MetadataValues: null
  DataQualityLevel: number | null
  DateCreated: string | null
  SubmissionStatus: {
    IsLive: boolean
    ID: number
    Title: string
  } | null
  ID: number
  UUID: string
  ParentChargePointID: number | null
  MediaItems: null
  IsRecentlyVerified: boolean
  DateLastVerified: string | null
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// ─── Add-Station Submission Types ────────────────────────────────────────────

export interface NewStationConnection {
  ConnectionTypeID: number
  LevelID: number | null
  PowerKW: number | null
  Quantity: number | null
  StatusTypeID: number | null
  CurrentTypeID: number | null
  Amps: number | null
  Voltage: number | null
  Comments: string | null
}

export interface NewStationPayload {
  AddressInfo: {
    Title: string
    AddressLine1: string
    AddressLine2: string | null
    Town: string
    StateOrProvince: string | null
    Postcode: string | null
    CountryID: number
    Latitude: number
    Longitude: number
    ContactTelephone1: string | null
    ContactEmail: string | null
    AccessComments: string | null
    RelatedURL: string | null
  }
  Connections: NewStationConnection[]
  OperatorID: number | null
  UsageTypeID: number | null
  StatusTypeID: number
  NumberOfPoints: number | null
  GeneralComments: string | null
}

// Reference data used in the "Add Station" form
export const CONNECTION_TYPES: { id: number; label: string }[] = [
  { id: 1, label: 'Type 1 (J1772)' },
  { id: 25, label: 'Type 2 (Mennekes)' },
  { id: 2, label: 'CHAdeMO' },
  { id: 32, label: 'CCS (Type 1 / Combo)' },
  { id: 33, label: 'CCS (Type 2 / Combo)' },
  { id: 57, label: 'GB/T AC' },
  { id: 26, label: 'GB/T DC' },
  { id: 0, label: 'Unknown' },
]

export const CHARGING_LEVELS: { id: number; label: string }[] = [
  { id: 1, label: 'Level 1 (AC ≤ 3.7 kW)' },
  { id: 2, label: 'Level 2 (AC 3.7 – 22 kW)' },
  { id: 3, label: 'Level 3 / DC Fast Charge' },
]

export const USAGE_TYPES: { id: number; label: string }[] = [
  { id: 1, label: 'Public' },
  { id: 4, label: 'Public – Membership Required' },
  { id: 5, label: 'Public – Pay At Location' },
  { id: 2, label: 'Private – Restricted Access' },
  { id: 7, label: 'Private – For Staff / Residents' },
]

export const STATUS_TYPES: { id: number; label: string }[] = [
  { id: 50, label: 'Operational' },
  { id: 75, label: 'Temporarily Unavailable' },
  { id: 100, label: 'Not Operational' },
  { id: 200, label: 'Planned for Future Date' },
]
