// scripts/test-arcgis.js
require("dotenv").config();
const {
    getLayerSchema,
    queryLayer,
} = require("../Controllers/Chat/services/arcgisLayerService");

(async () => {
    const schema = await getLayerSchema();
    console.log(
        "Fields:",
        schema.map((f) => `${f.name} (${f.alias})`),
    );

    const data = await queryLayer({ where: "1=1", resultRecordCount: 3 });
    console.log("Sample features:", data.features?.length, data.geometryType);
})();
