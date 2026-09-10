/*
    RPG Paper Maker Copyright (C) 2017-2026 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { ProjectUpdater } from '../ProjectUpdater';

const PIVOT_OFFSET = 0.49;
const BOX_SHAPE_KIND = 0;
const OBJECT_3D_ELEMENT_KIND = 9;
const NUMBER_DECIMAL_DYNAMIC_VALUE_KIND = 12;

const getOffset = (angleX: number, angleY: number, angleZ: number) => {
	const x = (angleX * Math.PI) / 180;
	const y = (angleY * Math.PI) / 180;
	const z = (angleZ * Math.PI) / 180;
	const cosX = Math.cos(x);
	const sinX = Math.sin(x);
	const cosY = Math.cos(y);
	const sinY = Math.sin(y);
	const cosZ = Math.cos(z);
	const sinZ = Math.sin(z);
	return {
		x: PIVOT_OFFSET * (cosY * cosZ + sinY) - PIVOT_OFFSET,
		y: PIVOT_OFFSET * (cosX * sinZ + sinX * sinY * cosZ - sinX * cosY),
		z: PIVOT_OFFSET * (sinX * sinZ - cosX * sinY * cosZ + cosX * cosY) - PIVOT_OFFSET,
	};
};

class ProjectUpdater_3_2_14 {
	static async update(_callback: unknown, data?: { specialElements?: Record<string, any> }) {
		const specialElements = data?.specialElements;
		const objects3D = (specialElements?.o as Record<string, any>[]) ?? [];
		await ProjectUpdater.updateAllMapPortions((json) => {
			for (const entry of (json.objs3d ?? []) as Record<string, any>[]) {
				const data = objects3D.find((object) => object.id === entry.v?.did);
				if (!data || (data.sk ?? BOX_SHAPE_KIND) !== BOX_SHAPE_KIND || (data.itl ?? true) === false) {
					continue;
				}
				const position = entry.k as number[];
				const offset = getOffset(position[8] ?? 0, position[7] ?? 0, position[9] ?? 0);
				if (offset.x === 0 && offset.y === 0 && offset.z === 0) {
					continue;
				}
				const x = Math.max(0, position[0] + (position[5] ?? 50) / 100 + offset.x);
				const y = position[1] + (position[2] ?? 0) / 100 + offset.y;
				const z = Math.max(0, position[3] + (position[6] ?? 50) / 100 + offset.z);
				position[0] = Math.floor(x);
				position[1] = Math.floor(y);
				position[2] = (y - Math.floor(y)) * 100;
				position[3] = Math.floor(z);
				position[5] = (x % 1) * 100;
				position[6] = (z % 1) * 100;
			}
		});
		await ProjectUpdater.updateAllObjectStates((state) => {
			if (state.gk !== OBJECT_3D_ELEMENT_KIND) {
				return;
			}
			const data = objects3D.find((object) => object.id === state.gid);
			if (!data || (data.sk ?? BOX_SHAPE_KIND) !== BOX_SHAPE_KIND || (data.itl ?? true) === false) {
				return;
			}
			const centerX = state.cx as Record<string, any> | undefined;
			const centerZ = state.cz as Record<string, any> | undefined;
			const angleX = state.ax as Record<string, any> | undefined;
			const angleY = state.ay as Record<string, any> | undefined;
			const angleZ = state.az as Record<string, any> | undefined;
			const values = [centerX, centerZ, angleX, angleY, angleZ];
			if (values.some((value) => value && value.k !== NUMBER_DECIMAL_DYNAMIC_VALUE_KIND)) {
				return;
			}
			const offset = getOffset(angleX?.v ?? 0, angleY?.v ?? 0, angleZ?.v ?? 0);
			if (offset.x === 0 && offset.z === 0) {
				return;
			}
			const updatedCenterX = centerX ?? { k: NUMBER_DECIMAL_DYNAMIC_VALUE_KIND, v: 50 };
			const updatedCenterZ = centerZ ?? { k: NUMBER_DECIMAL_DYNAMIC_VALUE_KIND, v: 50 };
			updatedCenterX.v += offset.x * 100;
			updatedCenterZ.v += offset.z * 100;
			state.cx = updatedCenterX;
			state.cz = updatedCenterZ;
		});
	}
}

export { ProjectUpdater_3_2_14 };
