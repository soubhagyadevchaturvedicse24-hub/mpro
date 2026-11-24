import { createStateMachine } from '../index.js';

export const TRANSPORT_TRANSITIONS = Object.freeze({
  dispatch: {
    from: ['PENDING'],
    to: 'DISPATCHED',
  },
  startTransit: {
    from: ['PENDING', 'DISPATCHED'],
    to: 'IN_TRANSIT',
  },
  arrive: {
    from: ['PENDING', 'DISPATCHED', 'IN_TRANSIT'],
    to: 'ARRIVED',
  },
  complete: {
    from: ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED'],
    to: 'COMPLETED',
  },
  cancel: {
    from: ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED'],
    to: 'CANCELLED',
  },
});

export const transportMachine = createStateMachine(TRANSPORT_TRANSITIONS);
