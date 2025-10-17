import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import awsConfig from '../config/aws';
import config from '../config/app';

const emailSenderTemplate = async (
  email: string,
  data: any,
  templateName: string,
): Promise<any> => {
  // Check if email validation is bypassed
  if (config.bypassEmailValidation) {
    return {
      MessageId: 'bypassed-email-template',
      bypassed: true,
      email,
      templateName,
      data,
    };
  }

  const sesClient = new SESClient({
    region: awsConfig.awsConfig.awsRegion || 'us-east-1',
    credentials: {
      accessKeyId: awsConfig.awsConfig.awsAccessKey || '',
      secretAccessKey: awsConfig.awsConfig.awsSecretKey || '',
    },
  });

  const command = new SendTemplatedEmailCommand({
    Source: `noreply@${config.mainDomain}`,
    Destination: {
      ToAddresses: [email],
    },
    Template: templateName,
    TemplateData: JSON.stringify(data),
  });

  return sesClient.send(command);
};

export { emailSenderTemplate };
