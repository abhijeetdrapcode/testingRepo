import { pluginCode } from 'drapcode-constant';
import { replaceValueFromSource } from 'drapcode-utility';
import { PREFIX_CONFIG } from '../utils/utils';
export const findInstalledPlugin = async (builderDB, query) => {
  const InstalledPlugin = builderDB.collection(`${PREFIX_CONFIG}plugins`);
  return await InstalledPlugin.findOne(query);
};

export const findAllInstalledPlugin = async (builderDB, projectId) => {
  let InstalledPlugin = builderDB.collection(`${PREFIX_CONFIG}plugins`);
  return await InstalledPlugin.find({ projectId }).toArray();
};
export const loadS3PluginConfig = async (builderDB, projectId, environment) => {
  const s3Plugin = await findInstalledPlugin(builderDB, { projectId, code: pluginCode.AWS_S3 });

  if (!s3Plugin) {
    const {
      AWS_S3_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET,
      AWS_S3_ICON_BUCKET_REGION,
      AWS_S3_ICON_BUCKET_ACCESS_KEY_ID,
      AWS_S3_ICON_BUCKET_SECRET_ACCESS_KEY,
      AWS_S3_ICON_BUCKET,
    } = process.env;
    return {
      region: AWS_S3_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      bucket: AWS_S3_BUCKET,
      publicRegion: AWS_S3_ICON_BUCKET_REGION,
      publicAccessKeyId: AWS_S3_ICON_BUCKET_ACCESS_KEY_ID,
      publicSecretAccessKey: AWS_S3_ICON_BUCKET_SECRET_ACCESS_KEY,
      publicBucket: AWS_S3_ICON_BUCKET,
    };
  }

  let {
    access_key,
    access_secret,
    bucket_name,
    region,
    public_access_key,
    public_access_secret,
    public_region,
    public_bucket_name,
  } = s3Plugin.setting;
  access_key = replaceValueFromSource(access_key, environment, null);
  access_secret = replaceValueFromSource(access_secret, environment, null);
  bucket_name = replaceValueFromSource(bucket_name, environment, null);
  region = replaceValueFromSource(region, environment, null);
  public_access_key =
    replaceValueFromSource(public_access_key, environment, null) ||
    process.env.AWS_S3_ICON_BUCKET_ACCESS_KEY_ID;
  public_access_secret =
    replaceValueFromSource(public_access_secret, environment, null) ||
    process.env.AWS_S3_ICON_BUCKET_SECRET_ACCESS_KEY;
  public_region =
    replaceValueFromSource(public_region, environment, null) ||
    process.env.AWS_S3_ICON_BUCKET_REGION;
  public_bucket_name =
    replaceValueFromSource(public_bucket_name, environment, null) || process.env.AWS_S3_ICON_BUCKET;
  return {
    region,
    bucket: bucket_name,
    accessKeyId: access_key,
    secretAccessKey: access_secret,
    publicRegion: public_region,
    publicAccessKeyId: public_access_key,
    publicSecretAccessKey: public_access_secret,
    publicBucket: public_bucket_name,
  };
};
export const loadMultiTenantSetting = async (builderDB, projectId) => {
  const multiTenantPlugin = await findInstalledPlugin(builderDB, {
    code: pluginCode.MULTI_TENANT_SAAS,
    projectId,
  });
  return multiTenantPlugin;
};

export const loadTypesensePluginConfig = async (builderDB, projectId, environment) => {
  const typesenseSearchPlugin = await findInstalledPlugin(builderDB, {
    projectId,
    code: pluginCode.TYPESENSE_SEARCH,
  });
  if (!typesenseSearchPlugin) return null;
  const { setting } = typesenseSearchPlugin;
  let { host, port, protocol, apiKey } = setting;
  host = replaceValueFromSource(host, environment, null);
  port = replaceValueFromSource(port, environment, null);
  protocol = replaceValueFromSource(protocol, environment, null);
  apiKey = apiKey
    ? replaceValueFromSource(apiKey, environment, null)
    : process.env.TYPESENSE_API_KEY;
  return { host, port, protocol, apiKey };
};
