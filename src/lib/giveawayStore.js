// basit in-memory store (bot resetlenirse sıfırlanır)
export const giveaways = new Map();
// key: messageId
// value: { prize, winners, endsAt, hostId, participants: Set<string> }
