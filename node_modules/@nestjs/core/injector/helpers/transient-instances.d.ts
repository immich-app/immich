import { InstanceWrapper } from '../instance-wrapper';
import { InstanceToken } from '../module';
/**
 * Returns the instances which are transient
 * @param instances The instances which should be checked whether they are transcient
 */
export declare function getTransientInstances(instances: [InstanceToken, InstanceWrapper][]): InstanceWrapper[];
/**
 * Returns the instances which are not transient
 * @param instances The instances which should be checked whether they are transcient
 */
export declare function getNonTransientInstances(instances: [InstanceToken, InstanceWrapper][]): InstanceWrapper[];
