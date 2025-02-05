import { TaskPosition } from "bsm";

export type ZoneId = number;

export interface Zone {
    id: ZoneId;
    element: HTMLElement;
    position: TaskPosition;
}

export class DragZone {
    private idCounter: ZoneId = 0;
    private zones: Zone[] = [];

    createDragZone(position: TaskPosition): HTMLElement {
        const zone = document.createElement("div");
        zone.classList.add("drag-zone");
        this.zones.push({
            element: zone,
            position,
            id: this.idCounter,
        });
        this.idCounter += 1;
        return zone;
    }

    private zoneActive(zone: Zone): boolean {
        const { width, height } = zone.element.getBoundingClientRect();
        return (width > 0 && height > 0);
    }

    private distance(left: [number, number], right: [number, number]): number {
        const distance = Math.sqrt(
            (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2,
        );
        return distance;
    }

    private zone_distance(zone: Zone, [x, y]: [number, number]): number {
        const bounds = zone.element.getBoundingClientRect();
        const zoneX = bounds.left + bounds.width * 0.5;
        const zoneY = bounds.top + bounds.height * 0.5;
        const distance = Math.sqrt(
            (x - zoneX) ** 2 + (y - zoneY) ** 2,
        );
        return distance;
    }
    markHtmlDragStatus(
        ref: HTMLElement,
        { beingDragged }: { beingDragged: boolean },
    ) {
        if (beingDragged) {
            ref.classList.add("being-dragged");
        } else {
            ref.classList.remove("being-dragged");
        }
    }

    closestDragZone(
        [x, y]: [number, number],
        { refCenter }: { refCenter: [number, number] },
    ): ZoneId | null {
        const distances: [Zone, number][] = this.zones
            .filter(this.zoneActive)
            .map(
                (zone) => [zone, this.zone_distance(zone, [x, y])],
            );
        const closest = distances.toSorted(([_, distA], [__, distB]) =>
            distB - distA
        ).pop();
        if (!closest) {
            throw new Error(
                "unreachable: tried to get closest drag zone with no drag zones created",
            );
        }
        const distanceToRefCenter = this.distance([x, y], refCenter);
        if (distanceToRefCenter < closest[1]) {
            return null;
        }
        return closest[0].id;
    }

    zoneFromId(zoneId: ZoneId): Zone {
        const zone = this.zones.find((v) => v.id === zoneId);
        if (!zone) {
            throw new Error(
                "unreachable: zoneId is provided by dragZone itself",
            );
        }
        return zone;
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

    removeHighlight() {
        for (const zone of this.zones) {
            zone.element.classList.remove("highlighted");
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
