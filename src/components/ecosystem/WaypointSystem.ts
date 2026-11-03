// Waypoint graph for the 2-floor Mountain Summit Studio Office (H.E.L.E.N.A. 3D HQ)
// Floor 1 (y = 0.05) and Floor 2 Mezzanine (y = 4.25) connected by a floating staircase.

export interface WaypointNode {
  pos: [number, number, number];
  edges: string[];
  label: string;
  pose?: 'sitting' | 'standing' | 'looking_clouds';
  lookAt?: [number, number, number];
}

export const WAYPOINTS: Record<string, WaypointNode> = {
  // Floor 2 (Mezzanine y = 4.25)
  desk_orchestrator: {
    pos: [0, 4.25, -1.35],
    edges: ['mezz_center'],
    label: 'Mesa H.E.L.E.N.A. (Orquestradora)',
    pose: 'sitting',
    lookAt: [0, 4.25, -2.5],
  },
  mezz_center: {
    pos: [0, 4.25, 0.2],
    edges: ['desk_orchestrator', 'mezz_railing_view', 'stairs_top'],
    label: 'Mezanino Central',
    pose: 'standing',
    lookAt: [0, 2.0, 5.0],
  },
  mezz_railing_view: {
    pos: [-2.8, 4.25, 1.3],
    edges: ['mezz_center', 'stairs_top'],
    label: 'Mirante Superior',
    pose: 'looking_clouds',
    lookAt: [-4.0, 3.5, 12.0],
  },
  stairs_top: {
    pos: [-6.5, 4.25, -1.0],
    edges: ['mezz_center', 'mezz_railing_view', 'stairs_mid'],
    label: 'Topo da Escada',
    pose: 'standing',
  },

  // Staircase Midpoint
  stairs_mid: {
    pos: [-6.5, 2.15, 1.2],
    edges: ['stairs_top', 'stairs_bottom'],
    label: 'Escada Flutuante',
    pose: 'standing',
  },

  // Floor 1 (Main Studio Floor y = 0.05)
  stairs_bottom: {
    pos: [-6.5, 0.05, 3.2],
    edges: ['stairs_mid', 'floor1_west_hall', 'lounge_plant_corner'],
    label: 'Base da Escada',
    pose: 'standing',
  },
  floor1_west_hall: {
    pos: [-3.5, 0.05, 0.5],
    edges: ['stairs_bottom', 'desk_academic', 'desk_archivist', 'collab_hub', 'lounge_plant_corner'],
    label: 'Corredor Oeste',
    pose: 'standing',
  },
  floor1_east_hall: {
    pos: [3.5, 0.05, 0.5],
    edges: ['desk_builder', 'desk_reviewer', 'collab_hub', 'coffee_station'],
    label: 'Corredor Leste',
    pose: 'standing',
  },

  // Desks on Floor 1
  desk_academic: {
    pos: [-4.8, 0.05, -0.95],
    edges: ['floor1_west_hall'],
    label: 'Mesa Agente Acadêmico',
    pose: 'sitting',
    lookAt: [-4.8, 0.05, -2.5],
  },
  desk_builder: {
    pos: [4.8, 0.05, -0.95],
    edges: ['floor1_east_hall'],
    label: 'Mesa Agente Construtor',
    pose: 'sitting',
    lookAt: [4.8, 0.05, -2.5],
  },
  desk_archivist: {
    pos: [-4.8, 0.05, 3.65],
    edges: ['floor1_west_hall', 'balcony_west'],
    label: 'Mesa Agente Arquivista',
    pose: 'sitting',
    lookAt: [-4.8, 0.05, 2.0],
  },
  desk_reviewer: {
    pos: [4.8, 0.05, 3.65],
    edges: ['floor1_east_hall', 'balcony_east'],
    label: 'Mesa Agente Revisor',
    pose: 'sitting',
    lookAt: [4.8, 0.05, 2.0],
  },

  // Social, Collaboration & Scenic Nodes
  collab_hub: {
    pos: [0, 0.05, 1.2],
    edges: ['floor1_west_hall', 'floor1_east_hall', 'balcony_center'],
    label: 'Mesa de Reunião Central',
    pose: 'standing',
    lookAt: [0, 0.8, 1.2],
  },
  lounge_plant_corner: {
    pos: [-6.8, 0.05, -3.2],
    edges: ['stairs_bottom', 'floor1_west_hall'],
    label: 'Jardim Interno & Sofá Zen',
    pose: 'standing',
    lookAt: [-4.0, 0.8, -3.2],
  },
  coffee_station: {
    pos: [6.8, 0.05, -3.2],
    edges: ['floor1_east_hall'],
    label: 'Coffee & Matcha Bar',
    pose: 'standing',
    lookAt: [4.0, 0.8, -2.0],
  },

  // Panoramic Cloud Balcony (Outdoor Deck)
  balcony_center: {
    pos: [0, 0.05, 6.2],
    edges: ['collab_hub', 'balcony_west', 'balcony_east'],
    label: 'Varanda Panorâmica das Nuvens',
    pose: 'looking_clouds',
    lookAt: [0, 0.5, 20.0],
  },
  balcony_west: {
    pos: [-3.6, 0.05, 6.2],
    edges: ['balcony_center', 'desk_archivist'],
    label: 'Mirante das Nuvens (Oeste)',
    pose: 'looking_clouds',
    lookAt: [-8.0, 0.5, 20.0],
  },
  balcony_east: {
    pos: [3.6, 0.05, 6.2],
    edges: ['balcony_center', 'desk_reviewer'],
    label: 'Mirante das Nuvens (Leste)',
    pose: 'looking_clouds',
    lookAt: [8.0, 0.5, 20.0],
  },
};

export const AGENT_HOME_NODE: Record<string, string> = {
  orchestrator: 'desk_orchestrator',
  academic: 'desk_academic',
  builder: 'desk_builder',
  archivist: 'desk_archivist',
  reviewer: 'desk_reviewer',
};

export const SCENIC_NODES = [
  'balcony_center',
  'balcony_west',
  'balcony_east',
  'mezz_railing_view',
  'lounge_plant_corner',
  'coffee_station',
  'collab_hub',
];

// Breadth-first search shortest path between two waypoint IDs
export function findWaypointPath(startKey: string, endKey: string): string[] {
  if (!WAYPOINTS[startKey] || !WAYPOINTS[endKey]) return [endKey];
  if (startKey === endKey) return [startKey];

  const queue: string[][] = [[startKey]];
  const visited = new Set<string>([startKey]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];

    if (node === endKey) {
      return path;
    }

    const neighbors = WAYPOINTS[node]?.edges || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }

  return [endKey];
}
