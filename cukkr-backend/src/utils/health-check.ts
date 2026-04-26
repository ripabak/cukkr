import { db } from '../lib/database'
import { verifySmtp } from '../lib/mail'

const CHECKS = {
	DATABASE: false,
	SMTP: false
}

const checkDatabaseConnection = async () => {
	try {
		await db.execute(`SELECT 1`)
		CHECKS.DATABASE = true
	} catch {
		CHECKS.DATABASE = false
	}
}

const checkSmtpConnection = async () => {
	try {
		await verifySmtp()
		CHECKS.SMTP = true
	} catch {
		CHECKS.SMTP = false
	}
}

export const healthCheck = async () => {
	await checkDatabaseConnection()
	await checkSmtpConnection()
	return {
		status: 'ok',
		message: 'Elysia Backend is running',
		checks: CHECKS
	}
}
