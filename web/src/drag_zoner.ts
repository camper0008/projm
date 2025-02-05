import { ColumnPosition, TaskPosition } from "bsm";

export type ZoneId = { inner: number };

export type Zone =
    | {
        id: ZoneId;
        element: HTMLElement;
        tag: "task";
        position: TaskPosition;
    }
    | {
        id: ZoneId;
        element: HTMLElement;
        tag: "column";
        position: ColumnPosition;
    };

type CreateDragZone =
    | { tag: "task"; position: TaskPosition }
    | { tag: "column"; position: ColumnPosition };

export class DragZoner {
    private idCounter: number = 0;
    private zones: Zone[] = [];

    createDragZone({ tag, position }: CreateDragZone): HTMLElement {
        const zone = document.createElement("div");
        zone.dataset["tag"] = tag;
        zone.classList.add("drag-zone");
        if (tag === "task") {
            this.zones.push({
                id: { inner: this.idCounter },
                tag,
                element: zone,
                position,
            });
        } else {
            this.zones.push({
                id: { inner: this.idCounter },
                tag,
                element: zone,
                position,
            });
        }
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
        if (closest === undefined) {
            return null;
        }
        const distanceToRefCenter = this.distance([x, y], refCenter);
        if (distanceToRefCenter < closest[1]) {
            return null;
        }
        return closest[0].id;
    }

    zoneFromId(zoneId: ZoneId): Zone {
        const zone = this.zones.find((v) => v.id === zoneId);
        if (zone === undefined) {
            throw new Error(
                "unreachable: zoneId is provided by dragZone itself",
            );
        }
        return zone;
    }

    showZones(tag: Zone["tag"]) {
        this.zones
            .filter((zone) => zone.tag === tag)
            .forEach((zone) => zone.element.classList.add("active"));
    }

    hideZones() {
        this.zones
            .forEach((zone) => zone.element.classList.remove("active"));
    }

    removeHighlights() {
        this.zones
            .forEach((zone) => zone.element.classList.remove("highlighted"));
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
