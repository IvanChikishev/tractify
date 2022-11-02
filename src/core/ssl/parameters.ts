export const CAAttributes = [
  {
    name: "commonName",
    value: "Tractify Proxy",
  },
  {
    name: "countryName",
    value: "United States",
  },
  {
    shortName: "ST",
    value: "Internet",
  },
  {
    name: "localityName",
    value: "Internet",
  },
  {
    name: "organizationName",
    value: "Tractify LLC",
  },
  {
    shortName: "OU",
    value: "CA",
  },
];

export const CAExtensions = [
  {
    name: "basicConstraints",
    cA: true,
  },
  {
    name: "keyUsage",
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: "extKeyUsage",
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true,
  },
  {
    name: "nsCertType",
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true,
  },
  {
    name: "subjectKeyIdentifier",
  },
];

export const ServerAttributes = [
  {
    name: "countryName",
    value: "United States",
  },
  {
    shortName: "ST",
    value: "Internet",
  },
  {
    name: "localityName",
    value: "Internet",
  },
  {
    name: "organizationName",
    value: "Tractify LLC",
  },
  {
    shortName: "OU",
    value: "Tractify LLC Server Certificate",
  },
];

export const ServerExtensions = [
  {
    name: "basicConstraints",
    cA: false,
  },
  {
    name: "keyUsage",
    keyCertSign: false,
    digitalSignature: true,
    nonRepudiation: false,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: "extKeyUsage",
    serverAuth: true,
    clientAuth: true,
    codeSigning: false,
    emailProtection: false,
    timeStamping: false,
  },
  {
    name: "nsCertType",
    client: true,
    server: true,
    email: false,
    objsign: false,
    sslCA: false,
    emailCA: false,
    objCA: false,
  },
  {
    name: "subjectKeyIdentifier",
  },
] as any[];
