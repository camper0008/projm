import { Id } from "./models.ts";

export type ZoneId = number;

export type DragParent = {
    type: "column";
    id: Id;
} | {
    type: "task";
    column: Id;
    id: Id;
};

export interface Zone {
    id: ZoneId;
    element: HTMLElement;
    parent: DragParent;
    index: number;
}

export class DragZone {
    private idCounter: ZoneId = 0;
    private zones: Zone[] = [];

    createDragZone(parent: DragParent, index: number): HTMLElement {
        const zone = document.createElement("div");
        zone.classList.add("drag-zone");
        this.zones.push({ element: zone, parent, index, id: this.idCounter });
        this.idCounter += 1;
        return zone;
    }

    private distance(zone: Zone, [x, y]: [number, number]): number {
        const bounds = zone.element.getBoundingClientRect();
        const zoneX = bounds.x + bounds.width * 0.5;
        const zoneY = bounds.y + bounds.height * 0.5;
        const distance = Math.sqrt(
            (x - zoneX) ** 2 + (y - zoneY) ** 2,
        );
        return distance;
    }

    closestDragZone([x, y]: [number, number]): ZoneId {
        const distances: [Zone, number][] = this.zones.map(
            (zone) => [zone, this.distance(zone, [x, y])],
        );
        const closest = distances.toSorted(([_, distA], [__, distB]) =>
            distB - distA
        ).pop();
        if (!closest) {
            throw new Error(
                "unreachable: tried to get closest drag zone with no drag zones created",
            );
        }
        return closest[0].id;
    }

    showZones() {
        for (const zone of this.zones) {
            zone.element.classList.add("active");
        }
    }

    hideZones() {
        for (const zone of this.zones) {
            zone.element.classList.remove("active");
        }
    }

    highlightZone(id: ZoneId) {
        for (const zone of this.zones) {
            if (zone.id === id) {
                zone.element.classList.add("highlighted");
            } else {
                zone.element.classList.remove("highlighted");
            }
        }
    }
}
