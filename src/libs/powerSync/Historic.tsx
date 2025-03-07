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

export const AppSchema = new Schema({
  Historic: HistoricSchema,
})

export type Database = (typeof AppSchema)["types"]
export type Historic = Database["Historic"]
