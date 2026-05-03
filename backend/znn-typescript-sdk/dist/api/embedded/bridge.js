import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { BRIDGE_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { BridgeInfo, OrchestratorInfo, BridgeNetworkInfo, BridgeNetworkInfoList, WrapTokenRequest, WrapTokenRequestList, UnwrapTokenRequest, UnwrapTokenRequestList, ZtsFeesInfo, TimeChallengesList, SecurityInfo } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Bridge as BridgeContract } from "../../embedded/index.js";
export class BridgeApi extends Api {
    //
    // RPC
    async getBridgeInfo() {
        const response = await this.client.sendRequest("embedded.bridge.getBridgeInfo", []);
        return BridgeInfo.fromJson(response);
    }
    async getOrchestratorInfo() {
        const response = await this.client.sendRequest("embedded.bridge.getOrchestratorInfo", []);
        return OrchestratorInfo.fromJson(response);
    }
    async getNetworkInfo(networkClass, chainId) {
        const response = await this.client.sendRequest("embedded.bridge.getNetworkInfo", [
            networkClass,
            chainId
        ]);
        return BridgeNetworkInfo.fromJson(response);
    }
    async getAllNetworks(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.bridge.getAllNetworks", [
            pageIndex,
            pageSize
        ]);
        return BridgeNetworkInfoList.fromJson(response);
    }
    async getWrapTokenRequestById(id) {
        const response = await this.client.sendRequest("embedded.bridge.getWrapTokenRequestById", [
            id.toString()
        ]);
        return WrapTokenRequest.fromJson(response);
    }
    async getAllWrapTokenRequests(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.bridge.getAllWrapTokenRequests", [
            pageIndex,
            pageSize
        ]);
        return WrapTokenRequestList.fromJson(response);
    }
    async getAllWrapTokenRequestsByToAddress(toAddress, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.bridge.getAllWrapTokenRequestsByToAddress", [
            toAddress,
            pageIndex,
            pageSize
        ]);
        return WrapTokenRequestList.fromJson(response);
    }
    async getAllWrapTokenRequestsByToAddressNetworkClassAndChainId(toAddress, networkClass, chainId, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.bridge.getAllWrapTokenRequestsByToAddressNetworkClassAndChainId", [
            toAddress,
            networkClass,
            chainId,
            pageIndex,
            pageSize
        ]);
        return WrapTokenRequestList.fromJson(response);
    }
    async getAllUnsignedWrapTokenRequests(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.bridge.getAllUnsignedWrapTokenRequests", [
            pageIndex,
            pageSize
        ]);
        return WrapTokenRequestList.fromJson(response);
    }
    async getUnwrapTokenRequestByHashAndLog(txHash, logIndex) {
        const response = await this.client.sendRequest("embedded.bridge.getUnwrapTokenRequestByHashAndLog", [
            txHash.toString(),
            logIndex
        ]);
        return UnwrapTokenRequest.fromJson(response);
    }
    async getAllUnwrapTokenRequests(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.bridge.getAllUnwrapTokenRequests", [
            pageIndex,
            pageSize
        ]);
        return UnwrapTokenRequestList.fromJson(response);
    }
    async getAllUnwrapTokenRequestsByToAddress(toAddress, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.bridge.getAllUnwrapTokenRequestsByToAddress", [
            toAddress,
            pageIndex,
            pageSize
        ]);
        return UnwrapTokenRequestList.fromJson(response);
    }
    async getFeeTokenPair(zts) {
        const response = await this.client.sendRequest("embedded.bridge.getFeeTokenPair", [
            zts.toString()
        ]);
        return ZtsFeesInfo.fromJson(response);
    }
    //
    // Common RPC
    async getSecurityInfo() {
        const response = await this.client.sendRequest("embedded.bridge.getSecurityInfo", []);
        return SecurityInfo.fromJson(response);
    }
    async getTimeChallengesInfo() {
        const response = await this.client.sendRequest("embedded.bridge.getTimeChallengesInfo", []);
        return TimeChallengesList.fromJson(response);
    }
    //
    // Contract methods
    wrapToken(networkClass, chainId, toAddress, amount, tokenStandard) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, tokenStandard, amount, BridgeContract.abi.encodeFunctionData("WrapToken", [
            networkClass,
            chainId,
            toAddress
        ]));
    }
    updateWrapRequest(id, signature) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("UpdateWrapRequest", [
            id.getBytes(),
            signature
        ]));
    }
    halt(signature) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("Halt", [
            signature
        ]));
    }
    changeTssECDSAPubKey(pubKey, oldPubKeySignature, newPubKeySignature) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("ChangeTssECDSAPubKey", [
            pubKey,
            oldPubKeySignature,
            newPubKeySignature
        ]));
    }
    redeem(transactionHash, logIndex) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("Redeem", [
            transactionHash.getBytes(),
            logIndex
        ]));
    }
    unwrapToken(networkClass, chainId, transactionHash, logIndex, toAddress, tokenAddress, amount, signature) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("UnwrapToken", [
            networkClass,
            chainId,
            transactionHash.getBytes(),
            logIndex,
            toAddress.toString(),
            tokenAddress,
            amount.toString(),
            signature
        ]));
    }
    //
    // Guardian contract methods
    proposeAdministrator(address) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("ProposeAdministrator", [
            address.toString()
        ]));
    }
    //
    // Administrator contract methods
    setNetwork(networkClass, chainId, name, contractAddress, metadata) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("SetNetwork", [
            networkClass,
            chainId,
            name,
            contractAddress,
            metadata
        ]));
    }
    removeNetwork(networkClass, chainId) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("RemoveNetwork", [
            networkClass,
            chainId
        ]));
    }
    setTokenPair(networkClass, chainId, tokenStandard, tokenAddress, bridgeable, redeemable, owned, minAmount, feePercentage, redeemDelay, metadata) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("SetTokenPair", [
            networkClass,
            chainId,
            tokenStandard.toString(),
            tokenAddress,
            bridgeable,
            redeemable,
            owned,
            minAmount.toString(),
            feePercentage,
            redeemDelay,
            metadata
        ]));
    }
    setNetworkMetadata(networkClass, chainId, metadata) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("SetNetworkMetadata", [
            networkClass,
            chainId,
            metadata
        ]));
    }
    removeTokenPair(networkClass, chainId, tokenStandard, tokenAddress) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("RemoveTokenPair", [
            networkClass,
            chainId,
            tokenStandard.toString(),
            tokenAddress
        ]));
    }
    unhalt() {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("Unhalt", []));
    }
    emergency() {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("Emergency", []));
    }
    changeAdministrator(administrator) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("ChangeAdministrator", [
            administrator.toString()
        ]));
    }
    setAllowKeyGen(allowKeyGen) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("SetAllowKeyGen", [
            allowKeyGen
        ]));
    }
    setBridgeMetadata(metadata) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("SetBridgeMetadata", [
            metadata
        ]));
    }
    revokeUnwrapRequest(transactionHash, logIndex) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("RevokeUnwrapRequest", [
            transactionHash.getBytes(),
            logIndex
        ]));
    }
    nominateGuardians(guardians) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("NominateGuardians", [
            guardians.map(address => address.toString())
        ]));
    }
    setOrchestratorInfo(windowSize, keyGenThreshold, confirmationsToFinality, estimatedMomentumTime) {
        return AccountBlockTemplate.callContract(BRIDGE_ADDRESS, ZNN_ZTS, BigNumber.from(0), BridgeContract.abi.encodeFunctionData("SetOrchestratorInfo", [
            windowSize,
            keyGenThreshold,
            confirmationsToFinality,
            estimatedMomentumTime
        ]));
    }
}
//# sourceMappingURL=bridge.js.map