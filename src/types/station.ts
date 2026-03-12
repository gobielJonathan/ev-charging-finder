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
