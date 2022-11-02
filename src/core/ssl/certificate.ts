import {
  CAAttributes,
  CAExtensions,
  ServerAttributes,
  ServerExtensions,
} from "./parameters";
import { pki, md } from "node-forge";
import { Database } from "../database";
import { CA } from "../../entities";
import { promisify } from "node:util";
import cp from "node:child_process";
import process from "node:process";
import path from "path";
import os from "node:os";
import crypto from "crypto";
import fs from "node:fs/promises";

const exec = promisify(cp.exec);

export class CertificateService {
  static readonly platforms = ["darwin"];
  static readonly CARepository = Database.getRepository(CA);

  static platform(): string {
    if (!this.platforms.includes(process.platform)) {
      throw new Error(`Platform ${process.platform} is not supported`);
    }

    return process.platform;
  }

  static async isTrusted(ca: string) {
    const platform = this.platform();

    const certificate = pki.certificateFromPem(ca);

    if (platform === "darwin") {
      try {
        const execute = await exec("security dump-trust-setting");
        const rows = {} as any;

        let lastLabelName = null;
        let lastRowLabel = null;

        for (const label of execute.stdout.split("\n")) {
          const resultLabel = label.match(
            /cert\s(?<index>[0-9]+):(?<name>.+)/i
          )?.groups;

          if (resultLabel?.index && resultLabel?.name) {
            lastLabelName = resultLabel.name?.trim();
            rows[lastLabelName] = {};
            continue;
          }

          const trustIsNext = /trust\ssetting\s([0-9]+)+:$/i.exec(label);

          if (trustIsNext) {
            lastRowLabel = label?.trim()?.replace(":", "");
            rows[lastLabelName as string][lastRowLabel] = [];

            continue;
          }

          const trustLabel = label.match(/(?<name>.+):(?<value>.+)/i)?.groups;

          if (
            !trustLabel?.name ||
            !trustLabel?.value ||
            !lastLabelName ||
            label.includes("Number of trust settings")
          ) {
            continue;
          }

          const name = trustLabel?.name?.trim();
          const value = trustLabel?.value?.trim();

          rows[lastLabelName as string][lastRowLabel as string].push({
            [name]: value,
          });
        }

        const certificateField = certificate.subject.attributes.find(
          ({ name }) => name === "commonName"
        );

        if (
          certificateField?.value &&
          rows[certificateField?.value as string]
        ) {
          return !Object.values(rows[certificateField.value as string]).find(
            (value: any) => {
              return value.find((value: any) => {
                return (
                  value["Result Type"] &&
                  value["Result Type"] !== "kSecTrustSettingsResultTrustRoot"
                );
              });
            }
          );
        }
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  static async has(certificate: string) {
    const platform = this.platform();

    if (platform === "darwin") {
      const execute = await exec("security find-ssl -a -p");
      return !!execute?.stdout?.includes(certificate?.replace(/\r/g, ""));
    }
  }

  static async getKeychainDir() {
    const platform = this.platform();

    if (platform === "darwin") {
      const execute = await exec("security login-keychain");
      return execute.stdout?.trim();
    }
  }

  static async createTemporaryCertificate(cert: pki.Certificate) {
    const certTmpPath = path.join(os.tmpdir(), crypto.randomUUID());
    await fs.writeFile(certTmpPath, pki.certificateToPem(cert), "utf8");

    return certTmpPath;
  }

  static async install(ca: string) {
    const platform = this.platform();

    const certificate = pki.certificateFromPem(ca);

    if (platform === "darwin") {
      const keychain = await this.getKeychainDir();
      const certPath = await this.createTemporaryCertificate(certificate);

      try {
        await exec(`security add-trusted-cert -k ${keychain} ${certPath}`);

        return true;
      } catch (cause: any) {
        return false;
      }
    }
  }

  static async release() {
    const ca = await this.CARepository.findOne({
      where: { host: "__MAIN__" },
    });

    if (!ca) {
      return new Promise<CA>((resolve, reject) => {
        pki.rsa.generateKeyPair({ bits: 2048 }, async (err, keypair) => {
          if (err) return reject(err);

          const ca = new CA();
          const cert = pki.createCertificate();

          cert.publicKey = keypair.publicKey;
          cert.serialNumber = CertificateService.randomSerialNumber();
          cert.validity.notBefore = new Date();
          cert.validity.notBefore.setDate(
            cert.validity.notBefore.getDate() - 1
          );
          cert.validity.notAfter = new Date();
          cert.validity.notAfter.setFullYear(
            cert.validity.notBefore.getFullYear() + 10
          );
          cert.setSubject(CAAttributes);
          cert.setIssuer(CAAttributes);
          cert.setExtensions(CAExtensions);
          cert.sign(keypair.privateKey, md.sha256.create());

          ca.ca = pki.certificateToPem(cert);
          ca.pk = pki.privateKeyToPem(keypair.privateKey);
          ca.publicKey = pki.publicKeyToPem(keypair.publicKey);
          ca.host = "__MAIN__";

          return resolve(this.CARepository.save(ca));
        });
      });
    }

    return ca;
  }

  static async releaseByHosts(hosts: string[], context: CA) {
    const mainHost = hosts[0];

    const ca = await this.CARepository.findOne({ where: { host: mainHost } });

    if (!ca) {
      const ca = new CA();

      const serverKeys = pki.rsa.generateKeyPair(2048);
      const serverCertificate = pki.createCertificate();

      serverCertificate.publicKey = serverKeys.publicKey;
      serverCertificate.serialNumber = CertificateService.randomSerialNumber();
      serverCertificate.validity.notBefore = new Date();
      serverCertificate.validity.notBefore.setDate(
        serverCertificate.validity.notBefore.getDate() - 1
      );
      serverCertificate.validity.notAfter = new Date();
      serverCertificate.validity.notAfter.setFullYear(
        serverCertificate.validity.notBefore.getFullYear() + 2
      );

      const attributesServer = ServerAttributes.slice(0);
      attributesServer.unshift({
        name: "commonName",
        value: mainHost,
      });

      const insertCA = pki.certificateFromPem(context.ca);

      serverCertificate.setSubject(attributesServer);
      serverCertificate.setIssuer(insertCA.issuer.attributes);
      serverCertificate.setExtensions(
        ServerExtensions.concat([
          {
            name: "subjectAltName",
            altNames: hosts.map((host) => {
              if (host.match(/^[\d.]+$/)) {
                return { type: 7, ip: host };
              }
              return { type: 2, value: host };
            }),
          },
        ])
      );

      serverCertificate.sign(
        pki.privateKeyFromPem(context.pk),
        md.sha256.create()
      );

      ca.host = mainHost;
      ca.ca = pki.certificateToPem(serverCertificate);
      ca.publicKey = pki.publicKeyToPem(serverKeys.publicKey);
      ca.pk = pki.privateKeyToPem(serverKeys.privateKey);

      return this.CARepository.save(ca);
    }

    return ca;
  }

  private static randomSerialNumber() {
    let sn = "";
    for (let i = 0; i < 4; i++) {
      sn += `00000000${Math.floor(Math.random() * 256 ** 4).toString(
        16
      )}`.slice(-8);
    }
    return sn;
  }
}
