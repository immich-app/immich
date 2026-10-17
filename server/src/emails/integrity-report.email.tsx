import { Link, Section, Text } from 'react-email';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component.js';
import ImmichLayout from 'src/emails/components/immich.layout.js';
import { IntegrityReport } from 'src/enum.js';
import { IntegrityErrorsReportEmailProps } from 'src/repositories/email.repository.js';
import { replaceTemplateTags } from 'src/utils/replace-template-tags.js';

export const IntegrityErrorsReportEmail = ({
  baseUrl,
  recipientName,
  checkType,
  checkName,
  count,
  customTemplate,
}: IntegrityErrorsReportEmailProps) => {
  const usableTemplateVariables = {
    recipientName,
    baseUrl,
    checkType,
    checkName,
    count: String(count),
  };

  const emailContent = customTemplate ? (
    replaceTemplateTags(customTemplate, usableTemplateVariables)
  ) : (
    <>
      <Text className="m-0">
        Hello <strong>{recipientName}</strong>,
      </Text>

      <Text>
        The {checkName} integrity check found <strong>{count}</strong> issue{count === 1 ? '' : 's'} in your Immich
        library.
      </Text>

      <Text>
        We recommend reviewing the report to identify affected files and determine whether any action is needed.
      </Text>
    </>
  );

  const reportUrl = `${baseUrl}/admin/maintenance/integrity-report/${checkType}`;

  return (
    <ImmichLayout preview={`Integrity errors were detected in your Immich library (${checkName}).`}>
      {customTemplate ? (
        <Text className="m-0">
          <div dangerouslySetInnerHTML={{ __html: emailContent }} />
        </Text>
      ) : (
        emailContent
      )}

      <Section className="my-6 flex justify-center">
        <ImmichButton href={reportUrl}>Review Integrity Report</ImmichButton>
      </Section>

      <Text className="text-xs">
        If you cannot click the button, use the link below to review the integrity report.
        <br />
        <Link href={reportUrl}>{reportUrl}</Link>
      </Text>
    </ImmichLayout>
  );
};

IntegrityErrorsReportEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app',
  recipientName: 'Alan Turing',
  checkType: IntegrityReport.MissingFile,
  checkName: 'Missing files',
  count: 3,
  customTemplate: '',
} as IntegrityErrorsReportEmailProps;

export default IntegrityErrorsReportEmail;
