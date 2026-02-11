/**
 * Script de prueba para Azure Blob Storage
 * Ejecutar: npx ts-node test-azure-upload.ts
 */

import dotenv from "dotenv";
import { BlobServiceClient } from "@azure/storage-blob";

dotenv.config();

async function testAzureBlobStorage() {
  console.log("\n🧪 Testing Azure Blob Storage Configuration\n");

  // 1. Verificar variables de entorno
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

  console.log(
    "✅ Connection String:",
    connectionString ? "Configured" : "❌ Missing",
  );
  console.log("✅ Container Name:", containerName);

  if (!connectionString) {
    console.error("\n❌ AZURE_STORAGE_CONNECTION_STRING not found in .env");
    process.exit(1);
  }

  try {
    // 2. Conectar a Azure Blob Storage
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    console.log("\n✅ Connected to Azure Blob Storage");

    // 3. Verificar que el contenedor existe
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const exists = await containerClient.exists();

    if (!exists) {
      console.log(
        `\n⚠️  Container "${containerName}" does not exist. Creating...`,
      );
      await containerClient.create(); // Sin access = privado por defecto
      console.log(`✅ Container "${containerName}" created successfully`);
    } else {
      console.log(`\n✅ Container "${containerName}" exists`);
    }

    // 4. Subir archivo de prueba con estructura de carpetas
    const testTenantId = "test-tenant-123";
    const testBusinessUnitId = "test-bu-456";
    const testFolder = "quotations";
    const testFileName = "test-file.txt";
    const testContent = `Test file uploaded at ${new Date().toISOString()}\nTenant: ${testTenantId}\nBusiness Unit: ${testBusinessUnitId}`;

    const blobPath = `${testTenantId}/${testBusinessUnitId}/${testFolder}/${testFileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    console.log(`\n📤 Uploading test file to: ${blobPath}`);

    await blockBlobClient.upload(testContent, testContent.length, {
      blobHTTPHeaders: { blobContentType: "text/plain" },
      metadata: {
        tenantId: testTenantId,
        businessUnitId: testBusinessUnitId,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log(`✅ File uploaded successfully!`);
    console.log(`📍 URL: ${blockBlobClient.url}`);

    // 5. Verificar que el archivo existe
    const fileExists = await blockBlobClient.exists();
    console.log(`\n✅ File exists in storage: ${fileExists}`);

    // 6. Listar archivos en el tenant
    console.log(`\n📁 Listing files for tenant "${testTenantId}":\n`);

    let fileCount = 0;
    for await (const blob of containerClient.listBlobsFlat({
      prefix: testTenantId,
    })) {
      fileCount++;
      console.log(`   ${fileCount}. ${blob.name}`);
      console.log(`      Size: ${blob.properties.contentLength} bytes`);
      console.log(`      Type: ${blob.properties.contentType}`);
    }

    console.log(`\n✅ Total files: ${fileCount}`);

    // 7. Descargar y verificar contenido
    console.log(`\n📥 Downloading file to verify content...`);
    const downloadResponse = await blockBlobClient.download();
    const downloadedContent = await streamToString(
      downloadResponse.readableStreamBody!,
    );
    console.log(`\n📄 Downloaded content:\n${downloadedContent}`);

    // 8. Cleanup (opcional - comentar si quieres mantener el archivo)
    console.log(`\n🧹 Cleaning up test file...`);
    await blockBlobClient.delete();
    console.log(`✅ Test file deleted`);

    console.log(
      `\n✅ ALL TESTS PASSED! Azure Blob Storage is configured correctly.\n`,
    );
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nDetails:", error);
    process.exit(1);
  }
}

// Helper para convertir stream a string
async function streamToString(
  readableStream: NodeJS.ReadableStream,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    readableStream.on("error", reject);
  });
}

// Ejecutar test
testAzureBlobStorage();
