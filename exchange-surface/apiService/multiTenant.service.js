import { findCollectionByUuid } from '../install-plugin/installedPlugin.service';
import { fetchMultiTenantCollectionItemsForPage } from './collection.service';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

export const loadMultiTenantPluginScript = async (
  req,
  res,
  pageId,
  pageContent,
  installedPlugins,
) => {
  const { projectId, builderDB } = req;
  const multiTenantSAASPlugin = installedPlugins.find((e) => e.code === 'MULTI_TENANT_SAAS');
  if (!multiTenantSAASPlugin) {
    return pageContent;
  }

  console.log('#####==> MULTI TENANT SAAS :>> ');
  const jsDom = new JSDOM(pageContent, { includeNodeLocations: true });
  let { multiTenantCollection } = multiTenantSAASPlugin.setting;
  if (!multiTenantCollection) {
    return pageContent;
  }
  multiTenantCollection = await findCollectionByUuid(
    builderDB,
    multiTenantSAASPlugin.setting.multiTenantCollection,
    projectId,
  );
  if (!multiTenantCollection) {
    return pageContent;
  }
  const multiTenantCollectionName = multiTenantCollection.collectionName;
  let collectionItems = await fetchMultiTenantCollectionItemsForPage(
    req,
    res,
    projectId,
    multiTenantCollectionName,
    pageId,
  );

  if (!collectionItems || Object.entries(collectionItems).length <= 0) {
    return pageContent;
  }

  if (req.isAuthenticated()) {
    const { user } = req;
    let userRoles = user?.userRoles || [];

    collectionItems = userRoles.length
      ? collectionItems.filter((collectionItem) =>
          collectionItem.userRoles?.some((ur) => userRoles.includes(ur)),
        )
      : [];

    const { tenantId } = user;
    const tenantIds = Array.isArray(tenantId) ? tenantId.map((tenant) => tenant._id) : [];

    if (tenantIds && tenantIds.length > 0) {
      collectionItems = collectionItems
        ? collectionItems.filter((collectionItem) => tenantIds.includes(collectionItem._id))
        : [];
    }
  } else {
    collectionItems = collectionItems.filter((collectionItem) => !collectionItem.userRoles.length);
  }

  if (collectionItems && collectionItems.length) {
    collectionItems.map(async (collItem) => {
      const permission = collItem.permission ? collItem.permission.join('') : '';
      collItem.pageComponents.map((pageComponentString) => {
        multiTenantHandlePageElements(pageComponentString, jsDom, permission);
      });
    });
  }

  pageContent = jsDom.serialize();
  return pageContent;
};
const multiTenantHandlePageElements = (pageComponentString, jsDom, permission) => {
  const pageComponentList = pageComponentString.split(':');
  // const pageSlug = pageComponentList[0];
  // const pageComponent = pageComponentList[1];
  const pageComponentId = pageComponentList[2];

  const jsDomPageElems = jsDom.window.document.querySelectorAll(`[id^=${pageComponentId}]`);
  if (jsDomPageElems && jsDomPageElems.length > 0) {
    jsDomPageElems.forEach((el) => {
      if (permission) {
        if (permission === 'Remove' || permission === 'Hide') {
          el.remove();
        } else if (permission === 'Disabled') {
          el.classList.add('disabled');
          el.setAttribute('disabled', true);
        } else if (permission === 'Read Only') {
          el.setAttribute('readonly', true);
        } else if (permission === 'Show') {
          el.classList.remove('d-none');
          el.classList.remove('hide');
          el.classList.remove('hidden');
          let elementStyleDisplayValue = el.style.display;
          el.style.display =
            elementStyleDisplayValue && elementStyleDisplayValue !== 'none'
              ? elementStyleDisplayValue
              : 'block';
          el.style.visibility = 'visible';
        }
      }
    });
  }
};

export const extractUserSettingFromUserAndTenant = (user, currentTenant) => {
  try {
    let userSetting;
    if (user && user.userSettingId) {
      const { userSettingId = [], uuid = '' } = user;
      console.log('userSettingId in user in middlware', userSettingId);
      const { uuid: tenantId = '' } = currentTenant ?? {};
      if (userSettingId && userSettingId.length) {
        const filteredUserSetting = userSettingId.filter((item) => {
          const tenantMatches = item.tenantId.length ? item?.tenantId[0]?.uuid === tenantId : false;
          const userMatches = item.userId.length ? item?.userId[0]?.uuid === uuid : false;
          return tenantMatches && userMatches;
        });
        if (filteredUserSetting && filteredUserSetting.length) {
          userSetting = filteredUserSetting[0];
          console.log('userSetting filtered', userSetting);
        } else {
          userSetting = userSettingId[0];
          console.log('userSetting first from user', userSetting);
        }
      }
    }
    console.log('extracted userSetting', userSetting);
    return userSetting;
  } catch (error) {
    console.error('Error extracting user setting:', error);
    return error;
  }
};
