/** Rooms and devices per principal. The "hub" is simulated; only its latency is real. */
export const ROOMS = ['living_room', 'bedroom', 'kitchen', 'office'] as const;
export type Room = (typeof ROOMS)[number];

export interface Device {
  id: string;
  name: string;
  type: 'light' | 'plug' | 'media' | 'climate' | 'blinds';
  room: Room;
  on: boolean;
  brightness?: number;
}

const SEED: Array<Omit<Device, 'on'>> = [
  { id: 'dev-lr-ceiling', name: 'Ceiling light', type: 'light', room: 'living_room', brightness: 100 },
  { id: 'dev-lr-floor', name: 'Floor lamp', type: 'light', room: 'living_room', brightness: 80 },
  { id: 'dev-lr-tv', name: 'TV', type: 'media', room: 'living_room' },
  { id: 'dev-lr-speaker', name: 'Speaker', type: 'media', room: 'living_room' },
  { id: 'dev-lr-blinds', name: 'Blinds', type: 'blinds', room: 'living_room' },
  { id: 'dev-lr-heater', name: 'Heater', type: 'climate', room: 'living_room' },
  { id: 'dev-br-ceiling', name: 'Ceiling light', type: 'light', room: 'bedroom', brightness: 100 },
  { id: 'dev-br-bedside', name: 'Bedside lamp', type: 'light', room: 'bedroom', brightness: 60 },
  { id: 'dev-br-fan', name: 'Fan', type: 'climate', room: 'bedroom' },
  { id: 'dev-kt-ceiling', name: 'Ceiling light', type: 'light', room: 'kitchen', brightness: 100 },
  { id: 'dev-kt-counter', name: 'Counter lights', type: 'light', room: 'kitchen', brightness: 100 },
  { id: 'dev-kt-kettle', name: 'Kettle plug', type: 'plug', room: 'kitchen' },
  { id: 'dev-of-desk', name: 'Desk lamp', type: 'light', room: 'office', brightness: 90 },
  { id: 'dev-of-monitor', name: 'Monitor plug', type: 'plug', room: 'office' },
];

export class Home {
  private byPrincipal = new Map<string, Device[]>();

  devices(principal: string): Device[] {
    let d = this.byPrincipal.get(principal);
    if (!d) this.byPrincipal.set(principal, (d = SEED.map((x) => ({ ...x, on: true }))));
    return d;
  }

  /** Apply to one room, or every room with 'all'. Returns the devices touched. */
  apply(principal: string, room: Room | 'all', change: { on?: boolean; brightness?: number }): Device[] {
    const touched = this.devices(principal).filter((d) => room === 'all' || d.room === room);
    for (const d of touched) {
      if (change.on !== undefined) d.on = change.on;
      if (change.brightness !== undefined && d.type === 'light') {
        d.brightness = change.brightness;
        d.on = change.brightness > 0;
      }
    }
    return touched;
  }
}

/** The upstream hub round trip the flawed server waits for on every call. */
export const HUB_MS = 1100;
export const hub = () => new Promise((r) => setTimeout(r, HUB_MS));
