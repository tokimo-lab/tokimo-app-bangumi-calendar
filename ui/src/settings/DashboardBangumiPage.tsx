import {
  Alert,
  ApiOutlined,
  Button,
  Card,
  CheckCircleOutlined,
  CloseCircleOutlined,
  Descriptions,
  EyeInvisibleOutlined,
  EyeOutlined,
  Form,
  Input,
  InputNumber,
  Progress,
  SaveOutlined,
  Spin,
  Tag,
} from "@tokiomo/components";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../generated/rust-api";
import { useMessage } from "../../../hooks";

/** Bangumi 设置内容（可嵌入 tab 使用） */
export function BangumiSettingsContent() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [showToken, setShowToken] = useState(false);
  const message = useMessage();

  const settingsQuery = api.externalDb.getBangumi.useQuery();
  const updateSettingsMutation = api.externalDb.updateBangumi.useMutation();
  const testMutation = api.externalDb.testBangumi.useMutation();
  const statusQuery = api.externalDb.status.useQuery();

  const bangumiStatus = statusQuery.data?.bangumi;

  useEffect(() => {
    if (settingsQuery.data) {
      form.setFieldsValue({
        accessToken: settingsQuery.data.accessToken ?? "",
        dailyLimit: settingsQuery.data.dailyLimit ?? undefined,
      });
    }
  }, [settingsQuery.data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await updateSettingsMutation.mutateAsync({
        accessToken: values.accessToken || null,
        dailyLimit:
          values.dailyLimit !== undefined && values.dailyLimit !== null
            ? values.dailyLimit
            : null,
      });
      message.success(t("media.bangumiSettings.saveSuccess"));
      statusQuery.refetch();
      handleTest();
    } catch (_error) {
      message.error(t("media.bangumiSettings.saveFailed"));
    }
  };

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      if (result.success) {
        message.success(t("media.bangumiSettings.testSuccess"));
      } else {
        message.error(
          result.errorMessage || t("media.bangumiSettings.testFailed"),
        );
      }
    } catch (_error) {
      message.error(t("media.bangumiSettings.testFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 连接状态 */}
      <Card
        title={t("media.bangumiSettings.connectionStatus")}
        size="small"
        extra={
          !statusQuery.isLoading && (
            <span
              className={
                bangumiStatus?.isConfigured
                  ? "text-sm text-green-600 dark:text-green-500"
                  : "text-sm text-gray-400 dark:text-gray-500"
              }
            >
              {bangumiStatus?.isConfigured
                ? t("media.bangumiSettings.connected")
                : t("media.bangumiSettings.disconnected")}
            </span>
          )
        }
      >
        {statusQuery.isLoading ? (
          <Spin />
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm">
              {t("media.systemStatus.apiUsage.todayUsed")}:{" "}
              <strong>{bangumiStatus?.dailyUsage ?? 0}</strong>
              {bangumiStatus?.dailyLimit != null ? (
                <span className="text-gray-500 dark:text-gray-400">
                  {" "}
                  / {bangumiStatus.dailyLimit}{" "}
                  <span className="text-xs">
                    ({t("media.systemStatus.apiUsage.remaining")}:{" "}
                    {Math.max(
                      0,
                      bangumiStatus.dailyLimit -
                        (bangumiStatus.dailyUsage ?? 0),
                    )}
                    )
                  </span>
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 ml-1 text-xs">
                  ({t("media.systemStatus.apiUsage.unlimited")})
                </span>
              )}
            </span>
            {bangumiStatus?.dailyLimit != null &&
              bangumiStatus.dailyLimit > 0 && (
                <Progress
                  percent={Math.min(
                    100,
                    Math.round(
                      ((bangumiStatus.dailyUsage ?? 0) /
                        bangumiStatus.dailyLimit) *
                        100,
                    ),
                  )}
                  size="small"
                  status={
                    (bangumiStatus.dailyUsage ?? 0) /
                      bangumiStatus.dailyLimit >=
                    0.9
                      ? "exception"
                      : "active"
                  }
                />
              )}
          </div>
        )}
      </Card>

      {/* 错误信息 - 仅在测试失败时显示 */}
      {testMutation.data && !testMutation.data.success && (
        <Alert
          type="error"
          message={
            testMutation.data.errorMessage ||
            t("media.bangumiSettings.testFailed")
          }
          showIcon
        />
      )}

      {/* Access Token 配置 */}
      <Card title={t("media.bangumiSettings.tokenConfig")} size="small">
        {settingsQuery.isLoading ? (
          <Spin />
        ) : (
          <Form
            form={form}
            layout="vertical"
            className="max-w-xl"
            autoComplete="off"
          >
            <Form.Item
              name="accessToken"
              label={t("media.bangumiSettings.tokenLabel")}
              extra={t("media.bangumiSettings.tokenExtra")}
            >
              <Input.Password
                placeholder={t("media.bangumiSettings.tokenPlaceholder")}
                visibilityToggle={{
                  visible: showToken,
                  onVisibleChange: setShowToken,
                }}
                iconRender={(visible) =>
                  visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>
            <Form.Item
              name="dailyLimit"
              label={t("media.systemStatus.apiUsage.dailyLimit")}
              extra={t("media.systemStatus.apiUsage.dailyLimitExtra")}
            >
              <InputNumber
                min={0}
                placeholder={t("media.systemStatus.apiUsage.unlimited")}
                className="w-full"
              />
            </Form.Item>
            <Form.Item>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={updateSettingsMutation.isPending}
                >
                  {t("media.common.save")}
                </Button>
                <Button
                  icon={<ApiOutlined />}
                  onClick={handleTest}
                  loading={testMutation.isPending}
                >
                  {t("media.bangumiSettings.testConnection")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Card>

      {/* 测试结果 */}
      {testMutation.data && (
        <Card
          title={t("media.bangumiSettings.testResult")}
          size="small"
          extra={
            testMutation.data.success ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                {t("media.common.success")}
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error">
                {t("media.common.failed")}
              </Tag>
            )
          }
        >
          {testMutation.data.success ? (
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  label: t("media.bangumiSettings.testName"),
                  children: (
                    <>
                      {testMutation.data.sampleTitle}
                      {testMutation.data.sampleTitleCn &&
                        testMutation.data.sampleTitleCn !==
                          testMutation.data.sampleTitle && (
                          <span className="text-gray-400 ml-2">
                            ({testMutation.data.sampleTitleCn})
                          </span>
                        )}
                    </>
                  ),
                },
              ]}
            />
          ) : (
            <Alert
              type="error"
              message={
                testMutation.data.errorMessage ||
                t("media.bangumiSettings.testFailed")
              }
              showIcon
            />
          )}
        </Card>
      )}

      {/* 功能说明 */}
      <Card title={t("media.bangumiSettings.featureDescription")} size="small">
        <div className="space-y-3">
          <div>
            <p className="font-semibold !mb-0.5">
              {t("media.bangumiSettings.animeMetadata")}
            </p>
            <p className="text-slate-500 dark:text-slate-400 !mb-0 text-sm">
              {t("media.bangumiSettings.animeMetadataDesc")}
            </p>
          </div>
          <div>
            <p className="font-semibold !mb-0.5">
              {t("media.bangumiSettings.freeApi")}
            </p>
            <p className="text-slate-500 dark:text-slate-400 !mb-0 text-sm">
              {t("media.bangumiSettings.freeApiDesc")}
            </p>
          </div>
        </div>
      </Card>

      {/* 相关链接 */}
      <Card title={t("media.bangumiSettings.relatedLinks")} size="small">
        <div className="space-y-1 text-sm">
          <div>
            <a
              className="text-[var(--accent-text)] hover:text-[var(--accent)]"
              href="https://bgm.tv"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("media.bangumiSettings.bangumiWebsite")}
            </a>
          </div>
          <div>
            <a
              className="text-[var(--accent-text)] hover:text-[var(--accent)]"
              href="https://next.bgm.tv/demo/access-token"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("media.bangumiSettings.getTokenLink")}
            </a>
          </div>
          <div>
            <a
              className="text-[var(--accent-text)] hover:text-[var(--accent)]"
              href="https://bangumi.github.io/api/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("media.bangumiSettings.apiDocs")}
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
