import { SES } from 'aws-sdk';
import awsConfig from '../config/aws';
import config from '../config/app';

const emailSenderTemplate = (
  email: string,
  data: any,
  templateName: string,
  callback: (email_err: any, email_data: any) => void,
) => {
  const ses = new SES({
    region: awsConfig.awsConfig.awsRegion,
    accessKeyId: awsConfig.awsConfig.awsAccessKey,
    secretAccessKey: awsConfig.awsConfig.awsSecretKey,
  });

  const destination = {
    ToAddresses: [email],
  };

  let params = {
    Source: `noreply@${config.mainDomain}`,
    Destination: destination,
    Template: templateName,
    TemplateData: JSON.stringify(data),
  };

  ses.sendTemplatedEmail(params, function (email_err: any, email_data: any) {
    if (email_err) {
      callback(email_err, email_data);
    } else {
      callback(null, email_data);
    }
  });
};

export { emailSenderTemplate };
