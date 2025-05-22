const { prepareFunction, PREFIX_CONFIG } = require('../utils/util');

export const countByCode = async (builderDB, code) => {
  const InstalledPlugin = builderDB.collection(`${PREFIX_CONFIG}plugins`);
  return await InstalledPlugin.countDocuments({ code });
};

export const findOneItem = async (builderDB, db, collectionId, itemId, page, timezone, user) => {
  collectionId = collectionId.toString().toLowerCase();
  const { titleTag } = page;
  let derivedFields = await builderDB
    .collection(`${PREFIX_CONFIG}collections`)
    .findOne({ collectionName: collectionId });

  derivedFields = derivedFields ? derivedFields.utilities : null;
  let result = await db.collection(collectionId).findOne({ uuid: itemId });
  if (!result) return;
  if (derivedFields) {
    let deriveField = derivedFields.find((field) => field.name === titleTag);
    if (deriveField) return { [titleTag]: prepareFunction(deriveField, result, timezone, user) };
  }
  return result;
};

export const findAllInstalledPlugin = async (builderDB, projectId) => {
  let Plugins = builderDB.collection(`${PREFIX_CONFIG}plugins`);
  const installedPlugins = await Plugins.find({ projectId }).toArray();
  return installedPlugins;
};

export const findOneInstalledPlugin = async (builderDB, projectId, code) => {
  const installedPlugin = await builderDB
    .collection(`${PREFIX_CONFIG}plugins`)
    .findOne({ code, projectId });
  return installedPlugin;
};

export const getEventByQuery = async (builderDB, query) => {
  return await builderDB.collection(`${PREFIX_CONFIG}events`).findOne(query);
};

export const findCollectionByUuid = async (builderDB, collectionId, projectId) => {
  let collection = await builderDB
    .collection(`${PREFIX_CONFIG}collections`)
    .findOne({ uuid: collectionId, projectId });
  return collection;
};
