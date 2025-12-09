"use server";

import {connectToDatabase} from "../database";
import {Address, User} from "@/lib/database/models/models";
import {Types} from "mongoose";

// Types
interface AddressInput {
    name: string;
    surname: string;
    county: string;
    city: string;
    address: string;
    user: string;  // user ID
}

interface AddressResponse {
    id: string;
    name: string;
    surname: string;
    county: string;
    city: string;
    address: string;
    user: string;
}

interface AddressActionReturn {
    error?: string;
    address?: AddressResponse;
}

interface AddressesActionReturn {
    error?: string;
    addresses?: AddressResponse[];
}

// Convert Address document to response type
function convertToResponse(address: any): AddressResponse {
    return {
        id: address._id.toString(),
        name: address.name,
        surname: address.surname,
        county: address.county,
        city: address.city,
        address: address.address,
        user: address.user.toString()
    };
}

// Create new address
export async function createAddress(addressData: AddressInput): Promise<AddressActionReturn> {
    try {
        await connectToDatabase();

        if (!Types.ObjectId.isValid(addressData.user)) {
            throw new Error("Invalid user ID");
        }

        // Check if user exists
        const user = await User.findById(addressData.user);
        if (!user) {
            throw new Error("User not found");
        }

        // Create address
        const address = await Address.create(addressData);

        // Add address to user's addresses array
        await User.findByIdAndUpdate(
            addressData.user,
            {$push: {address: address._id}}
        );

        return {address: convertToResponse(address)};
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to create address"
        };
    }
}

// Update existing address
export async function updateAddress(
    addressId: string,
    addressData: AddressInput
): Promise<AddressActionReturn> {
    try {
        await connectToDatabase();

        if (!Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address ID");
        }

        const address = await Address.findByIdAndUpdate(
            addressId,
            addressData,
            {new: true}
        );

        if (!address) {
            throw new Error("Address not found");
        }

        return {address: convertToResponse(address)};
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to update address"
        };
    }
}

// Delete address
export async function deleteAddress(
    addressId: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        await connectToDatabase();

        if (!Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address ID");
        }

        const address = await Address.findById(addressId);
        if (!address) {
            throw new Error("Address not found");
        }

        // Remove address from user's addresses array
        await User.findByIdAndUpdate(
            address.user,
            {$pull: {address: addressId}}
        );

        // Delete the address
        await Address.findByIdAndDelete(addressId);

        return {success: true};
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to delete address"
        };
    }
}

// Get addresses by user
export async function getAddressesByUser(userId: string): Promise<AddressesActionReturn> {
    try {
        await connectToDatabase();

        if (!Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }

        const addresses = await Address.find({user: userId}).sort({_id: -1});
        return {
            addresses: addresses.map(convertToResponse)
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to fetch addresses"
        };
    }
}

// Get specific address
export async function getAddress(addressId: string): Promise<AddressActionReturn> {
    try {
        await connectToDatabase();

        if (!Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address ID");
        }

        const address = await Address.findById(addressId);
        if (!address) {
            throw new Error("Address not found");
        }

        return {address: convertToResponse(address)};
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to fetch address"
        };
    }
}