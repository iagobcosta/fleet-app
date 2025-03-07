import { createRealmContext, Realm } from "@realm/react"

import { Historic } from "./schemas/Historic"

const realmAccessBehavior: Realm.OpenRealmBehaviorConfiguration = {
  type: Realm.OpenRealmBehaviorType.OpenImmediately,
}

export const syncConfig = {
  partitionValue: null,
  newRealmFileBehavior: realmAccessBehavior,
  existingRealmFileBehavior: realmAccessBehavior,
}

export const { RealmProvider, useRealm, useObject, useQuery } =
  createRealmContext({
    schema: [Historic] as any,
  })
