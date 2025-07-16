import {PrimusZKTLS} from "@primuslabs/zktls-js-sdk";
// import { PrimusContractAbi } from "./primusContractAbi";
// import { ethers } from "ethers";

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();

//**** Set appId and appSecret here!!!
const appId = "0x4bf0468034fd3e9cc4678915f25b253351c5a3ef";
const appSecret =
  "0xe37b6e481d80c537838f7b16e7fe70bd9d48a7326f32c0eaabdd1c82074c819a";
if(!appId || !appSecret){
    alert("appId or appSecret is not set.")
    throw new Error("appId or appSecret is not set.");
}

const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProof(_channelName: string, callback: (attestation: string) => void) {
    // Set TemplateID and user address.
    const attTemplateID = "2e3160ae-8b1e-45e3-8c59-426366278b9d";
    // ***You change address according to your needs.***
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    // Generate attestation request.
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
    request.setAttConditions([
      [
        {
          type: "CONDITION_EXPANSION",
          op: "MATCH_ONE",
          key: "login",
          field: "$[0].data.currentUser.subscriptionBenefits.edges[*]+",
          value: [
            {
              type: "FIELD_RANGE",
              op: "STREQ",
              field: "+.node.user.login",
            },
          ],
        },
      ],
    ]);

    request.setAttMode({
        algorithmType: "proxytls"
    });

    // Transfer request object to string.
    const requestStr = request.toJsonString();

    // Sign request.
    const signedRequestStr = await primusZKTLS.sign(requestStr);

    // Start attestation process.
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    // Verify siganture.
    const verifyResult = await primusZKTLS.verifyAttestation(attestation)
    console.log("verifyResult=", verifyResult);

    // 回调
    if (verifyResult) {
        callback(attestation);
    }

    // if (verifyResult) {
    //     // Business logic checks, such as attestation content and timestamp checks
    //     // do your own business logic.
    //     callback(attestation);
    //
    //     const contractAddress = "0xCE7cefB3B5A7eB44B59F60327A53c9Ce53B0afdE";
    //     const provider = new ethers.providers.JsonRpcProvider(
    //       "https://rpc.basecamp.t.raas.gelato.cloud"
    //     );
    //     const contract = new ethers.Contract(contractAddress, PrimusContractAbi, provider);
    //     try {
    //       // Call verifyAttestation func
    //       await contract.verifyAttestation(attestation);
    //       console.log("verify Attestation on chain true");
    //     } catch (error) {
    //       console.error("Error in verifyAttestation:", error);
    //     }
    // } else {
    //     // If failed, define your own logic.
    // }
}