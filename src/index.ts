import { Logger } from "./core/logger";
import { Database } from "./core/database";
import { Commissioner } from "./core/commissioner";
import { CertificateService } from "./core/ssl/certificate";

async function bootstrap() {
  Logger.info("Service starting..");

  await Database.initialize();

  const certificate = await CertificateService.release();
  const isSslTrusted = await CertificateService.isTrusted(certificate.ca);

  if (!isSslTrusted) {
    await CertificateService.install(certificate.ca);
  }

  const commissioner = new Commissioner({
    host: "0.0.0.0",
    port: 8000,
    ssl: certificate,
  });

  await commissioner.listen();
}

bootstrap();
