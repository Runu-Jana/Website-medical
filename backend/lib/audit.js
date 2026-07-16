import prisma from '../prisma/client.js';

// Append-only audit trail for sensitive actions (Rx approvals, order status
// changes, refunds). Never throws into the request path — logging must not
// break the operation it records.
export const audit = (actor, action, entity, entityId, details) =>
  prisma.auditLog
    .create({
      data: {
        actorId: actor?.id || actor?._id || '',
        actorName: actor?.name || '',
        actorRole: actor?.role || '',
        action,
        entity: entity || '',
        entityId: entityId || '',
        details: details || undefined,
      },
    })
    .catch(() => {});
