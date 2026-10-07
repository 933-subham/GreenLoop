# Firestore schema (role-based)

## users/{userId}
- `userId`, `email`, `displayName`, `role` (`citizen` | `partner` | `admin`)
- `createdAt`, `stats` (reportsSubmitted, reportsResolved)

## wallets/{userId}
- `userId`, `balance`, `updatedAt`  
- Only Cloud Functions update balance; client can create with balance 0 on sign up.

## reports/{reportId}
- `userId`, `imageURL`, `description`, `garbageType`, `intensity`, `intensityScore`, `priority`, `confidence`, `fraudScore`
- `location` (GeoPoint), `address`, `status` (pending | assigned | in_progress | collected)
- `assignedTo` (partner uid), `afterImageURL`, `timestamps` (createdAt, updatedAt, assignedAt, collectedAt)

## assignments/{assignmentId}
- `reportId`, `partnerId`, `status`, `timestamps`

## transactions/{txId}
- `userId`, `reportId`?, `amount`, `type` (credit|debit), `reason`, `idempotencyKey`, `createdAt`

## shopProducts/{productId}
- `title`, `description`, `priceInEcoCoins`, `inventory`, `active`

## orders/{orderId}
- `userId`, `products` (array), `total`, `status`, `createdAt`

## partners/{partnerId}
- `partnerId`, `approved`, `vehicleType`, `performance` (jobsCompleted, avgResponseTime)

## notifications/{notificationId}
- `userId`, `type`, `title`, `body`, `data`, `read`, `createdAt`

---

**Admin:** Set a user as admin in Firebase Console → Firestore → `users/{uid}` → set `role` to `admin`.
