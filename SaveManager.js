import * as THREE from 'three';

class SaveManager {
    constructor(world, uiManager) {
        this.world = world;
        this.uiManager = uiManager;
        this.isDirty = false;
        this.saveInterval = 5000; // 5 seconds

        this.init();
    }

    init() {
        setInterval(() => this.autoSave(), this.saveInterval);
        window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
    }

    setDirty() {
        this.isDirty = true;
    }

    save() {
        if (!this.world || !this.uiManager) return;

        const saveData = {
            textures: [],
            voxels: []
        };

        // Save texture URLs
        saveData.textures = this.uiManager.materials.map(material => material.map.image.src);

        // Save voxels (position and material index)
        this.world.voxels.forEach(voxelMesh => {
            const materialIndex = this.uiManager.materials.indexOf(voxelMesh.material);
            if (materialIndex > -1) {
                saveData.voxels.push({
                    position: voxelMesh.position.toArray(),
                    materialIndex: materialIndex
                });
            }
        });

        localStorage.setItem('voxel-world-save', JSON.stringify(saveData));
        this.isDirty = false;
        console.log('World saved.');
    }

    autoSave() {
        if (this.isDirty) {
            this.save();
        }
    }

    async load() {
        const savedData = localStorage.getItem('voxel-world-save');
        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);
            
            // Load textures
            // The default texture is already loaded, so we skip it.
            const texturePromises = data.textures.slice(1).map(url => new THREE.TextureLoader().loadAsync(url));
            const textures = await Promise.all(texturePromises);
            textures.forEach(texture => this.uiManager.addTextureToPalette(texture, false));

            // Load voxels
            data.voxels.forEach(voxelData => {
                const position = new THREE.Vector3().fromArray(voxelData.position);
                const material = this.uiManager.materials[voxelData.materialIndex];
                if (material) {
                    this.world.addVoxel(position, material, false);
                }
            });
            console.log('World loaded.');
        } catch (error) {
            console.error('Failed to load world data:', error);
            localStorage.removeItem('voxel-world-save');
        }
    }

    onBeforeUnload(event) {
        if (this.isDirty) {
            event.preventDefault();
            // Most browsers show a generic message, but this is required for it to trigger
            event.returnValue = ''; 
            return '';
        }
    }
}

export default SaveManager;