import { column, Schema, Table } from "@powersync/react-native"

export const HistoricSchema = new Table({
  id: column.text,
  user_id: column.text,
  license_plate: column.text,
  description: column.text,
  status: column.text,
  created_at: column.text,
  updated_at: column.text,
})

export const CoordsSchema = new Table(
  {
    id: column.text,
    historic_id: column.text,
    latitude: column.real,
    longitude: column.real,
    timestamp: column.text,
  },
  { indexes: { HistoricSchema: ["historic_id"] } }
)

export const AppSchema = new Schema({
  Historic: HistoricSchema,
  Coords: CoordsSchema,
})

export type Database = (typeof AppSchema)["types"]
export type Historic = Database["Historic"]
export type Coords = Database["Coords"]
