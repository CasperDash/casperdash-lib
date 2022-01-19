import {
	DeployUtil,
	Signer,
	RuntimeArgs,
	CLValueBuilder,
	CLAccountHash,
	CLKey,
	CLTypeBuilder,
	CLPublicKey,
} from 'casper-js-sdk';
import { PAYMENT_AMOUNT, MOTE_RATE, DEPLOY_TTL_MS } from '../constants/key';

/**
 * Get Transfer deploy
 * @param {CLPublicKey} fromAccount main account public key
 * @param {CLPublicKey} toAccount public key of target account
 * @param {Number} amount transfer amount
 * @param {Number} transferId transfer id. This parameter is optional
 * @param {Number} fee transfer fee
 * @returns {Deploy} transfer deploy
 */
export const buildTransferDeploy = (
	fromAccount: CLPublicKey,
	toAccount: CLPublicKey,
	amount: number,
	transferId: number,
	fee: number,
	networkName: string,
) => {
	const deployParams = new DeployUtil.DeployParams(fromAccount, networkName);
	const transferParams = DeployUtil.ExecutableDeployItem.newTransfer(amount, toAccount, null, transferId);
	const payment = DeployUtil.standardPayment(fee * MOTE_RATE);
	return DeployUtil.makeDeploy(deployParams, transferParams, payment);
};

/**
 * Build deploy for contract
 * @param {CLPublicKey} baseAccount main account public key
 * @param {Object} session hash contract content
 * @returns {Deploy} deploy of the contract
 */
export const buildContractInstallDeploy = (baseAccount: CLPublicKey, session: any, networkName: string) => {
	const deployParams = new DeployUtil.DeployParams(baseAccount, networkName);
	const payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);
	return DeployUtil.makeDeploy(deployParams, session, payment);
};

/**
 * Sign a deploy by singer
 * @param {Deploy} deploy main account public key
 * @param {String} mainAccountHex hash contract content
 * @param {String} setAccountHex contract's arguments
 * @param {Object} ledgerOptions ledger's options
 * @returns {Deploy} Signed deploy
 */
export const signDeployByCasperSigner = async (deploy: any, mainAccountHex: string, setAccountHex: string) => {
	const deployObj = DeployUtil.deployToJson(deploy);
	const signedDeploy = await Signer.sign(deployObj, mainAccountHex, setAccountHex);
	return signedDeploy;
};

/**
 * Get Recipient address
 * @param {CLPublicKey} recipient
 */
export const createRecipientAddress = (recipient: CLPublicKey) => {
	return new CLKey(new CLAccountHash(recipient.toAccountHash()));
};

/**
 * Get Transfer Token deploy
 * @param {CLPublicKey} fromAccount from account public key
 * @param {CLPublicKey} toAccount to account public key
 * @param {Number} amount transfer amount
 * @param {String} contractHash token contract hash
 * @returns {Deploy} transfer deploy
 */
export const buildTransferTokenDeploy = (
	fromAccount: CLPublicKey,
	toAccount: CLPublicKey,
	amount: number,
	contractHash: string,
	fee: number,
	networkName: string,
) => {
	const contractHashAsByteArray = contractHashToByteArray(contractHash);
	const deployParams = new DeployUtil.DeployParams(fromAccount, networkName, 1, DEPLOY_TTL_MS);
	const transferParams = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
		contractHashAsByteArray,
		'transfer',
		RuntimeArgs.fromMap({
			amount: CLValueBuilder.u256(amount),
			recipient: createRecipientAddress(toAccount),
		}),
	);
	const payment = DeployUtil.standardPayment(fee * MOTE_RATE);
	return DeployUtil.makeDeploy(deployParams, transferParams, payment);
};

/**
 * Request to connect with signer
 * @returns {string} error message
 */
export const connectCasperSigner = () => {
	try {
		Signer.sendConnectionRequest();
	} catch (error: any) {
		return error.message;
	}
};

export const toCLMap = (map: Map<string, string>) => {
	const clMap = CLValueBuilder.map([CLTypeBuilder.string(), CLTypeBuilder.string()]);
	for (const [key, value] of Array.from(map.entries())) {
		clMap.set(CLValueBuilder.string(key), CLValueBuilder.string(value));
	}
	return clMap;
};

export const contractHashToByteArray = (contractHash: string) => Uint8Array.from(Buffer.from(contractHash, 'hex'));
